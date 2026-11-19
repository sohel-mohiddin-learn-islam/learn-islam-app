import { auth } from "./firebase";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

const WORKER = ((import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined) || "").replace(/\/$/, "");

async function authHeader() {
  const t = await auth.currentUser?.getIdToken();
  if (!t) throw new Error("Please sign in.");
  return { Authorization: `Bearer ${t}` };
}

/* ------------------------- Talking: microphone -> text ------------------------- */

let rec: MediaRecorder | null = null;
let chunks: Blob[] = [];
let stream: MediaStream | null = null;

export async function startRecording(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Voice recording is not supported on this device.");
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported?.(m));
  chunks = [];
  rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.start();
}

export function stopRecording(): Promise<Blob | null> {
  return new Promise((resolve) => {
    const r = rec;
    if (!r) return resolve(null);
    r.onstop = () => {
      stream?.getTracks().forEach((t) => t.stop());
      const blob = chunks.length ? new Blob(chunks, { type: r.mimeType || "audio/webm" }) : null;
      rec = null; stream = null; chunks = [];
      resolve(blob);
    };
    try { r.stop(); } catch { resolve(null); }
  });
}

export function cancelRecording() {
  try { rec?.stop(); } catch { /* ignore */ }
  stream?.getTracks().forEach((t) => t.stop());
  rec = null; stream = null; chunks = [];
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });

/** Sends the recording to the server (Whisper speech recognition) and returns the words that were spoken. */
export async function transcribe(blob: Blob, language: string): Promise<string> {
  if (!WORKER) throw new Error("Voice server is not set up.");
  const audio = await toBase64(blob);
  const r = await fetch(`${WORKER}/stt`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ audio, language: language === "roman-hindi" ? "hi" : language === "roman-telugu" ? "te" : "en" }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || typeof j.text !== "string") throw new Error(j.error || "Could not understand the recording.");
  return j.text.trim();
}

/* ---------------- Listening: text -> natural human-like voice ---------------- */

let playing: HTMLAudioElement | null = null;
let session = 0;

/** Remove markdown and symbols so the voice reads naturally. */
export function cleanForSpeech(t: string): string {
  return String(t)
    .replace(/##\s*\d\.\s*/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\(([^)]*\d+:\d+[^)]*)\)/g, "$1")
    .replace(/\bSAW\b/g, "peace be upon him")
    .replace(/\bPBUH\b/g, "peace be upon him")
    .replace(/ﷺ/g, "peace be upon him")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(t: string, max = 260): string[] {
  const sentences = t.match(/[^.!?\n]+[.!?]*\s*/g) || [t];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { out.push(cur.trim()); cur = ""; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function fetchVoice(text: string): Promise<string> {
  const r = await fetch(`${WORKER}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error("tts " + r.status);
  const blob = await r.blob();
  return URL.createObjectURL(blob);
}

export function stopSpeaking() {
  session++;
  try { playing?.pause(); } catch { /* ignore */ }
  playing = null;
  TextToSpeech.stop().catch(() => {});
}

/**
 * Speaks the text with a natural neural voice from the server, sentence by sentence (the next part is fetched while the
 * current one plays). If the server voice is unavailable it falls back to the phone's own voice.
 */
export async function speakHuman(raw: string, onState?: (speaking: boolean) => void): Promise<void> {
  stopSpeaking();
  const my = session;
  const text = cleanForSpeech(raw);
  if (!text) return;
  onState?.(true);
  try {
    if (!WORKER || !auth.currentUser) throw new Error("no server");
    const parts = chunkText(text).slice(0, 14);
    let next: Promise<string> | null = fetchVoice(parts[0]);
    for (let i = 0; i < parts.length; i++) {
      const url = await next!;
      if (my !== session) { URL.revokeObjectURL(url); return; }
      next = i + 1 < parts.length ? fetchVoice(parts[i + 1]) : null;
      next?.catch(() => {});
      await new Promise<void>((resolve, reject) => {
        const a = new Audio(url);
        playing = a;
        a.onended = () => { URL.revokeObjectURL(url); resolve(); };
        a.onerror = () => { URL.revokeObjectURL(url); reject(new Error("play")); };
        a.play().catch(reject);
      });
      if (my !== session) return;
    }
  } catch {
    if (my !== session) return;
    try { await TextToSpeech.speak({ text: text.slice(0, 3500), lang: "en-US", rate: 0.95, volume: 1, pitch: 1, category: "ambient" }); } catch { /* ignore */ }
  } finally {
    if (my === session) onState?.(false);
  }
}
