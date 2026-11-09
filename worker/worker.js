// Cloudflare Worker: free AI tutor backend (Workers AI) + FCM push sender.
// Secrets/vars: FIREBASE_PROJECT_ID (var), FCM_SERVICE_ACCOUNT (secret, JSON), binding AI.
const PROJECT = (env) => env.FIREBASE_PROJECT_ID || "learn-islam-891c3";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const dec = (s) => JSON.parse(new TextDecoder().decode(b64u(s)));

async function verifyIdToken(token, env) {
  const [h, p, sig] = token.split(".");
  const header = dec(h), payload = dec(p);
  const jwks = await (await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com", { cf: { cacheTtl: 3600 } })).json();
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("kid");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(sig), new TextEncoder().encode(`${h}.${p}`));
  const now = Date.now() / 1000;
  if (!ok || payload.aud !== PROJECT(env) || payload.iss !== `https://securetoken.google.com/${PROJECT(env)}` || payload.exp < now) throw new Error("bad token");
  return payload; // payload.user_id
}

const SYSTEM = `You are "Learn Islam Tutor", a knowledgeable, respectful assistant who answers ANY question.
ALWAYS format every answer in exactly two parts:

## 1. Science
Give the scientific/factual answer: evidence, mechanisms, data, consensus, and limits of knowledge. Name the field or study type. If the question is not scientific (history, ethics, daily life), give the best factual/rational perspective.

## 2. Islam
Give the Islamic perspective with proof. Quote Qur'an as (Surah Name chapter:verse) and hadith as (Collection, number, e.g. Sahih al-Bukhari 1). Only cite references you are highly confident exist and say what they say; if unsure, say "I am not certain of the exact reference" instead of inventing one. Mention scholarly differences (madhhab) when they exist and recommend asking a qualified scholar for personal fatwa.

DEBATE MODE (when the user disagrees, challenges Islam, or asks to debate): stay calm, polite and confident. Steelman their view first, then respond point by point with evidence from science (logic, data) AND Islam (Qur'an and Hadith). Concede valid points honestly. Never insult. End with one thoughtful question back.

Rules: never fabricate verses, hadith numbers, studies or statistics. Do not claim science "proves" scripture when it only agrees; say "is consistent with". Reply in the user's language (if they write Roman Hindi/Urdu/Telugu, answer in the same). Keep answers focused and well structured.`;

async function ask(req, env) {
  const auth = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  let uid;
  try { uid = (await verifyIdToken(auth, env)).user_id; } catch { return json({ error: "Please sign in." }, 401); }
  const body = await req.json();
  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const msgs = [
    { role: "system", content: SYSTEM + (body.debate ? "\n\nThe user has switched DEBATE MODE ON." : "") },
    ...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 3000) })),
    { role: "user", content: String(body.message || "").slice(0, 2000) },
  ];
  const out = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages: msgs, max_tokens: 1400, temperature: 0.4 });
  return json({ answer: out.response || "" , uid });
}

// ---- TURN credentials for calls (optional: Cloudflare Calls TURN, free tier) ----
async function turn(req, env) {
  const auth = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  try { await verifyIdToken(auth, env); } catch { return json({ error: "auth" }, 401); }
  if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN) return json({ iceServers: [] });
  const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.TURN_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ttl: 86400 }),
  });
  return json(await r.json());
}

// ---- FCM push ----
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const pem = sa.private_key.replace(/-----[^-]+-----|\s/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const jwt = `${unsigned}.${btoa(String.fromCharCode(...sig)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;
  const r = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` })).json();
  return r.access_token;
}

async function push(req, env) {
  const auth = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  let me;
  try { me = (await verifyIdToken(auth, env)).user_id; } catch { return json({ error: "auth" }, 401); }
  const { toUid, title, body } = await req.json();
  if (!toUid || toUid === me) return json({ sent: 0 });
  const sa = JSON.parse(env.FCM_SERVICE_ACCOUNT);
  const at = await accessToken(sa);
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT(env)}/databases/default/documents/users/${toUid}/tokens`;
  const list = await (await fetch(base, { headers: { Authorization: `Bearer ${at}` } })).json();
  let sent = 0;
  for (const d of list.documents || []) {
    const token = d.fields?.token?.stringValue;
    if (!token) continue;
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT(env)}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { token, notification: { title: String(title || "Learn Islam").slice(0, 80), body: String(body || "").slice(0, 200) }, android: { priority: "HIGH", notification: { channel_id: "li-social", icon: "ic_stat_icon" } } } }),
    });
    if (r.ok) sent++;
    else if (r.status === 404) await fetch(d.name.startsWith("http") ? d.name : `https://firestore.googleapis.com/v1/${d.name}`, { method: "DELETE", headers: { Authorization: `Bearer ${at}` } });
  }
  return json({ sent });
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const path = new URL(req.url).pathname;
    try {
      if (path === "/ask") return await ask(req, env);
      if (path === "/turn") return await turn(req, env);
      if (path === "/push") return await push(req, env);
    } catch (e) { return json({ error: String(e.message || e) }, 500); }
    return json({ ok: true });
  },
};
