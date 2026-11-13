import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Send, Swords } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/contexts/LanguageContext";

type Msg = { role: "user" | "assistant"; content: string };
const ENDPOINT = (import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined) || "";

const SUGGESTIONS = [
  "Why is the sky blue?",
  "What does Islam say about the origin of the universe?",
  "Is evolution compatible with Islam?",
  "Debate: Does God exist?",
];

/** Split an answer into "1. Science" and "2. Islam" parts. */
function splitParts(t: string) {
  t = String(t ?? "");
  const m = t.match(/##\s*1\.?\s*Science([\s\S]*?)(?:##\s*2\.?\s*Islam([\s\S]*))?$/i);
  if (!m) return { science: "", islam: "", other: t };
  return { science: m[1].trim(), islam: (m[2] || "").trim(), other: "" };
}

/** Find Qur'an references like 2:255 or "Surah Al-Baqarah 2:255" in text. */
function findAyat(t: string): string[] {
  const out = new Set<string>();
  const re = /\b(\d{1,3}):(\d{1,3})(?:-\d+)?\b/g;
  let m;
  while ((m = re.exec(t))) {
    if (+m[1] >= 1 && +m[1] <= 114 && +m[2] >= 1 && +m[2] <= 286) out.add(`${m[1]}:${m[2]}`);
  }
  return Array.from(out).slice(0, 4);
}

const ayahCache = new Map<string, { ar: string; en: string; name: string } | null>();
function VerifiedAyah({ refKey }: { refKey: string }) {
  const [d, setD] = useState<{ ar: string; en: string; name: string } | null | undefined>(ayahCache.get(refKey));
  useEffect(() => {
    if (ayahCache.has(refKey)) return;
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${refKey}/en.sahih`).then((r) => r.json()),
      fetch(`https://api.alquran.cloud/v1/ayah/${refKey}/quran-uthmani`).then((r) => r.json()),
    ])
      .then(([en, ar]) => {
        const v = en?.data && ar?.data ? { en: en.data.text, ar: ar.data.text, name: en.data.surah.englishName } : null;
        ayahCache.set(refKey, v);
        setD(v);
      })
      .catch(() => { ayahCache.set(refKey, null); setD(null); });
  }, [refKey]);
  if (!d) return null;
  return (
    <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="flex items-center gap-1 text-xs text-primary font-semibold mb-1">
        <span aria-hidden>✔</span> Verified Qur'an text · {d.name} {refKey}
      </p>
      <p className="text-lg leading-loose text-right" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>{d.ar}</p>
      <p className="text-foreground/80">{d.en}</p>
    </div>
  );
}

function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-2 leading-relaxed text-[15px]">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {p.split(/(\*\*[^*]+\*\*)/g).map((s, j) =>
            s.startsWith("**") ? <strong key={j}>{s.slice(2, -2)}</strong> : <span key={j}>{s}</span>,
          )}
        </p>
      ))}
    </div>
  );
}

function Answer({ content }: { content: string }) {
  const p = splitParts(content);
  if (p.other) return <Rich text={p.other} />;
  const ayat = findAyat(p.islam);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3">
        <p className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 mb-1"><span aria-hidden>🔬</span> 1. Science</p>
        <Rich text={p.science} />
      </div>
      {p.islam && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 mb-1"><span aria-hidden>🌙</span> 2. Islam</p>
          <Rich text={p.islam} />
          {ayat.map((a) => <VerifiedAyah key={a} refKey={a} />)}
        </div>
      )}
    </div>
  );
}

/** Shows the real error instead of a blank "Something went wrong" page, so a problem here can be reported precisely. */
class TutorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="font-semibold mb-2">AI Tutor hit a problem</p>
        <p className="text-sm text-muted-foreground break-words">{String(this.state.err.message)}</p>
        <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-words mt-2">{String(this.state.err.stack || "").slice(0, 600)}</pre>
        <button onClick={() => this.setState({ err: null })} className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground">Try again</button>
      </div>
    );
  }
}

export default function AITutor() {
  return <TutorBoundary><Tutor /></TutorBoundary>;
}

function Tutor() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [debate, setDebate] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { end.current?.scrollIntoView({ block: "nearest" }); } catch { /* ignore */ }
  }, [messages, loading]);

  async function send(value = question) {
    const text = value.trim();
    if (!text || loading) return;
    setQuestion("");
    const history = messages;
    setMessages((o) => [...o, { role: "user", content: text }]);
    const reply = (content: string) => setMessages((o) => [...o, { role: "assistant", content }]);
    if (!ENDPOINT) return reply("The AI backend isn't set up yet. Deploy the Cloudflare Worker (see worker/README.md) and set VITE_AI_TUTOR_ENDPOINT.");
    const user = auth.currentUser;
    if (!user) return reply("Please sign in to use the AI Tutor.");
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch(`${ENDPOINT.replace(/\/$/, "")}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history, debate, language }),
      });
      const j = await r.json();
      const a = typeof j?.answer === "string" ? j.answer : j?.answer ? JSON.stringify(j.answer) : "";
      reply(a || (typeof j?.error === "string" ? j.error : "") || "No answer received.");
    } catch {
      reply("Could not reach the tutor. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-serif text-primary">AI Tutor</h1>
        <button
          onClick={() => setDebate(!debate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${debate ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
        >
          <Swords className="w-4 h-4" /> Debate {debate ? "ON" : "OFF"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="mb-4">Ask anything. Every answer comes in two parts: <b>1. Science</b> and <b>2. Islam</b> (Qur'an &amp; Hadith). Turn on Debate to challenge it.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="px-3 py-1.5 rounded-full border border-border bg-card text-sm text-foreground">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2">{m.content}</div>
          ) : (
            <Answer key={i} content={m.content} />
          ),
        )}
        {loading && <div className="flex items-center gap-2 text-muted-foreground"><span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> Thinking…</div>}
        <div ref={end} />
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        AI can make mistakes. Qur'an verses shown in green boxes are checked against a Qur'an database; always verify hadith in the original books and ask a scholar for rulings.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 mt-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={debate ? "Make your argument…" : "Ask any question…"}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button type="submit" disabled={loading} className="px-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="w-5 h-5" /></button>
      </form>
    </div>
  );
}
