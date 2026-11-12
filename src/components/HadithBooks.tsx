import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { shareContent } from "@/lib/share";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/contexts/LanguageContext";
import { hadiths as LOCAL } from "@/data/hadiths";

/**
 * Hadith "book edition" browser. Texts are loaded on demand from the free, open hadith-api
 * (github.com/fawazahmed0/hadith-api, Unlicense). Several mirrors are tried; if all fail, the hadith
 * bundled inside the app are shown so a book is never empty.
 */
const PATH = "gh/fawazahmed0/hadith-api@1/editions";
const HOSTS = [
  (p: string) => `https://cdn.jsdelivr.net/${PATH}/${p}`,
  (p: string) => `https://fastly.jsdelivr.net/${PATH}/${p}`,
  (p: string) => `https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/${p}`,
];
const WORKER = ((import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined) || "").replace(/\/$/, "");

type Book = { id: string; name: string; arabic: string; by: string; from: string; to: string; local?: string };
const BOOKS: Book[] = [
  { id: "bukhari", name: "Sahih al-Bukhari", arabic: "صحيح البخاري", by: "Imam al-Bukhari", from: "#14532d", to: "#052e16", local: "Sahih Bukhari" },
  { id: "muslim", name: "Sahih Muslim", arabic: "صحيح مسلم", by: "Imam Muslim", from: "#7f1d1d", to: "#450a0a", local: "Sahih Muslim" },
  { id: "abudawud", name: "Sunan Abi Dawud", arabic: "سنن أبي داود", by: "Imam Abu Dawud", from: "#1e3a8a", to: "#172554", local: "Sunan Abu Dawud" },
  { id: "tirmidhi", name: "Jami at-Tirmidhi", arabic: "جامع الترمذي", by: "Imam at-Tirmidhi", from: "#581c87", to: "#3b0764", local: "Sahih Tirmidhi" },
  { id: "nasai", name: "Sunan an-Nasa'i", arabic: "سنن النسائي", by: "Imam an-Nasa'i", from: "#134e4a", to: "#042f2e" },
  { id: "ibnmajah", name: "Sunan Ibn Majah", arabic: "سنن ابن ماجه", by: "Imam Ibn Majah", from: "#78350f", to: "#451a03", local: "Sunan Ibn Majah" },
  { id: "malik", name: "Muwatta Malik", arabic: "موطأ مالك", by: "Imam Malik", from: "#3f3f46", to: "#18181b" },
  { id: "nawawi", name: "40 Hadith of Nawawi", arabic: "الأربعون النووية", by: "Imam an-Nawawi", from: "#9a3412", to: "#431407" },
  { id: "qudsi", name: "40 Hadith Qudsi", arabic: "الأحاديث القدسية", by: "Compiled", from: "#0c4a6e", to: "#082f49" },
];

type Sec = { no: string; title: string; first?: number; last?: number };
type Had = { n: number; text: string; ar?: string; grade?: string; ref?: string; rh?: string; rt?: string };
type Loaded = { sections: Sec[]; full?: any; offline?: boolean };

const cache = new Map<string, any>();
async function getJson(path: string) {
  if (cache.has(path)) return cache.get(path);
  let lastErr: any;
  for (const h of HOSTS) {
    try {
      const r = await fetch(h(path));
      if (!r.ok) { lastErr = new Error(String(r.status)); continue; }
      const j = await r.json();
      cache.set(path, j);
      return j;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("offline");
}

function parseSections(j: any): Sec[] {
  const names = j?.metadata?.section || {};
  const det = j?.metadata?.section_detail || {};
  return Object.keys(names)
    .filter((k) => k !== "0" && String(names[k]).trim() !== "")
    .map((k) => ({ no: k, title: String(names[k]), first: det[k]?.hadithnumber_first, last: det[k]?.hadithnumber_last }))
    .sort((a, b) => Number(a.no) - Number(b.no));
}

const inSec = (h: any, s: Sec) =>
  (s.first != null && s.last != null && h.hadithnumber >= s.first && h.hadithnumber <= s.last) ||
  (h.reference?.book != null && String(h.reference.book) === s.no);

function gradeOf(h: any): string | undefined {
  const g = h?.grades;
  if (!Array.isArray(g) || !g.length) return undefined;
  return g.map((x: any) => `${x.grade}${x.name ? ` (${x.name})` : ""}`).join(", ");
}

const toHad = (h: any, arMap?: Map<number, string>): Had => ({
  n: h.hadithnumber,
  text: h.text,
  ar: arMap?.get(h.hadithnumber),
  grade: gradeOf(h),
  ref: h.reference && h.reference.book ? `Book ${h.reference.book}, Hadith ${h.reference.hadith}` : undefined,
});

/** hadith bundled in the app (works without internet) */
function localFor(b: Book): Had[] {
  if (!b.local) return [];
  return LOCAL.filter((h) => h.source.startsWith(b.local!)).map((h) => ({
    n: Number(h.source.replace(/\D+/g, "")) || 0,
    text: h.english,
    ar: h.arabic,
    ref: h.source,
    rh: h.romanHindi,
    rt: (h as any).romanTelugu,
  }));
}

async function loadBook(b: Book): Promise<Loaded> {
  // 1) a single chapter file already lists every chapter name
  try {
    const j = await getJson(`eng-${b.id}/sections/1.json`);
    const secs = parseSections(j);
    if (secs.length > 1) return { sections: secs };
  } catch { /* try next */ }
  // 2) the whole book file (bigger, but always has the chapter list)
  try {
    const full = await getJson(`eng-${b.id}.min.json`);
    const hads: any[] = (full?.hadiths || []).filter((h: any) => String(h?.text || "").trim());
    let secs = parseSections(full).filter((s) => !hads.length || hads.some((h) => inSec(h, s)));
    if (!secs.length && hads.length) {
      const seen = new Map<string, number>();
      hads.forEach((h) => { const b = h.reference?.book; if (b != null && !seen.has(String(b))) seen.set(String(b), 1); });
      secs = [...seen.keys()].sort((a, b) => Number(a) - Number(b)).map((k) => ({ no: k, title: `Book ${k}` }));
    }
    if (secs.length) return { sections: secs, full };
    if (full?.hadiths?.length) return { sections: [{ no: "all", title: "All hadith" }], full };
  } catch { /* offline */ }
  const local = localFor(b);
  if (local.length) return { sections: [{ no: "local", title: "Selected hadith" }], offline: true };
  throw new Error("offline");
}

async function loadSection(b: Book, data: Loaded, sec: Sec): Promise<Had[]> {
  if (sec.no === "local") return localFor(b);
  let en: any[] = [];
  if (data.full) {
    const all: any[] = data.full.hadiths || [];
    en = sec.no === "all" ? all : all.filter((h) => inSec(h, sec));
  } else {
    en = (await getJson(`eng-${b.id}/sections/${sec.no}.json`)).hadiths || [];
    if (!en.some((h) => String(h?.text || "").trim())) {
      try {
        const full = await getJson(`eng-${b.id}.min.json`);
        en = (full.hadiths || []).filter((h: any) => inSec(h, sec));
      } catch { /* keep what we have */ }
    }
  }
  en = en.filter((h) => String(h?.text || "").trim());
  const arMap = new Map<number, string>();
  try {
    const ar = await getJson(`ara-${b.id}/sections/${sec.no}.json`);
    (ar.hadiths || []).forEach((h: any) => arMap.set(h.hadithnumber, h.text));
  } catch { /* Arabic is optional */ }
  return en.map((h) => toHad(h, arMap));
}

// ---- Roman Hindi (translated by the AI on request, saved on the phone) ----
let running = 0;
const waiting: (() => void)[] = [];
const slot = () => new Promise<void>((res) => { if (running < 3) { running++; res(); } else waiting.push(() => { running++; res(); }); });
const free = () => { running--; waiting.shift()?.(); };
type Lang = "en" | "rh" | "rt";
async function toRoman(lang: "rh" | "rt", key: string, text: string): Promise<string> {
  const k = `${lang}:${key}`;
  try { const c = localStorage.getItem(k); if (c) return c; } catch { /* ignore */ }
  if (!WORKER || !auth.currentUser) throw new Error("no server");
  await slot();
  try {
    const t = await auth.currentUser.getIdToken();
    const r = await fetch(`${WORKER}/translate`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ text, lang: lang === "rt" ? "te" : "hi" }) });
    const j = await r.json();
    if (!r.ok || !j.text) throw new Error(j?.error || "failed");
    try { localStorage.setItem(k, j.text); } catch { /* ignore */ }
    return j.text;
  } finally { free(); }
}

const T = {
  en: { all: "All books", read: "Read in", load: "Load more", left: "left", chap: "Chapter", share: "Share", grade: "Grade", empty: "No hadith in this chapter.", err: "Could not load this book. Check your internet and try again.", retry: "Try again", offline: "No internet: showing hadith saved inside the app.", tr: "Translating…" },
  rt: { all: "Anni pustakalu", read: "Chadavandi", load: "Inka chupinchu", left: "migilindi", chap: "Adhyayam", share: "Share cheyyandi", grade: "Sthayi", empty: "Ee adhyayamlo hadees ledu.", err: "Pustakam load kaaledu. Internet check chesi malli prayatninchandi.", retry: "Malli prayatninchandi", offline: "Internet ledu: app lo saved hadees chupistunnam.", tr: "Roman Telugu loki marchutunnam…" },
  rh: { all: "Saari kitaabein", read: "Padhein", load: "Aur dikhayein", left: "baaki", chap: "Baab", share: "Share karein", grade: "Darja", empty: "Is baab mein koi hadees nahi.", err: "Kitaab load nahi hui. Internet check karke dobara koshish karein.", retry: "Dobara koshish karein", offline: "Internet nahi hai: app mein saved hadees dikha rahe hain.", tr: "Roman Hindi mein ho raha hai…" },
};

function HadithCard({ h, book, lang, tx, onShare, note }: { h: Had; book: Book; lang: Lang; tx: typeof T.en; onShare: (h: Had) => void; note: string }) {
  const roman = lang !== "en";
  const [tr, setTr] = useState<{ rh: string | null; rt: string | null }>({ rh: h.rh || null, rt: h.rt || null });
  const [state, setState] = useState<"" | "loading" | "err">("");
  const rh = lang === "en" ? null : tr[lang];
  useEffect(() => {
    if (lang === "en" || tr[lang]) { setState(""); return; }
    let live = true;
    setState("loading");
    toRoman(lang, `${book.id}:${h.n}`, h.text).then((t) => { if (live) { setTr((o) => ({ ...o, [lang]: t })); setState(""); } }).catch(() => live && setState("err"));
    return () => { live = false; };
  }, [lang]);
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex justify-between text-xs text-muted-foreground mb-3">
        <span>{book.name} · {roman ? "Hadees" : "Hadith"} {h.n || ""}</span>
        <button onClick={() => onShare({ ...h, text: roman && rh ? rh : h.text })} className="text-primary">{note || tx.share}</button>
      </div>
      {h.ar && (
        <p className="text-xl font-serif text-primary leading-loose text-right mb-3" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>{h.ar}</p>
      )}
      {roman ? (
        state === "loading" ? <p className="text-muted-foreground text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{tx.tr}</p>
        : rh ? <p className="leading-relaxed">{rh}</p>
        : <p className="leading-relaxed text-foreground/80">{h.text}</p>
      ) : (
        <p className="leading-relaxed">{h.text}</p>
      )}
      {(h.grade || h.ref) && (
        <p className="text-xs text-muted-foreground mt-3">{h.grade && <>{tx.grade}: {h.grade}. </>}{h.ref}</p>
      )}
    </div>
  );
}

function Cover({ b }: { b: Book }) {
  return (
    <div
      className="relative w-full h-full rounded-r-xl rounded-l-sm overflow-hidden text-center flex flex-col items-center justify-center px-4"
      style={{
        background: `linear-gradient(135deg, ${b.from}, ${b.to})`,
        boxShadow: "inset 0 0 0 1px rgba(255,215,120,.25), 4px 6px 14px rgba(0,0,0,.45)",
      }}
    >
      {/* spine */}
      <span className="absolute left-0 inset-y-0 w-4" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.55), rgba(255,255,255,.08) 60%, rgba(0,0,0,.25))" }} />
      {/* gold frame */}
      <span className="absolute inset-3 left-6 rounded-md border border-amber-300/60" />
      <span className="absolute inset-[18px] left-[30px] rounded border border-amber-300/30" />
      <span className="text-amber-300 text-xl mb-2">✦</span>
      <span className="text-amber-200 text-xl leading-snug" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>{b.arabic}</span>
      <span className="mt-3 text-amber-100/90 text-sm font-serif leading-tight">{b.name}</span>
      <span className="mt-2 text-[10px] text-amber-200/60 tracking-wide">{b.by}</span>
      <span className="absolute bottom-5 text-amber-300/70 text-xs">❖ ❖ ❖</span>
    </div>
  );
}

function OpeningBook({ b }: { b: Book }) {
  return (
    <motion.div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className="relative w-56 h-72"
        style={{ perspective: 1200 }}
        initial={{ scale: 0.6, x: 0 }}
        animate={{ scale: 1.25, x: 60 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      >
        {/* pages */}
        <div className="absolute inset-0 rounded-r-xl bg-amber-50 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(transparent 0 22px, rgba(120,80,20,.35) 22px 23px)" }} />
          <p className="absolute inset-0 flex items-center justify-center text-amber-900/70 text-2xl" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>بسم الله الرحمن الرحيم</p>
        </div>
        {/* cover swings open from the spine */}
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: -158 }}
          transition={{ duration: 0.9, ease: "easeInOut", delay: 0.15 }}
        >
          <Cover b={b} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function HadithBooks() {
  const { language } = useLanguage();
  const [lang, setLang] = useState<Lang>(language === "roman-hindi" ? "rh" : language === "roman-telugu" ? "rt" : "en");
  const tx = T[lang];
  const [book, setBook] = useState<Book | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [section, setSection] = useState<Sec | null>(null);
  const [items, setItems] = useState<Had[] | null>(null);
  const [error, setError] = useState(false);
  const [tries, setTries] = useState(0);
  const [limit, setLimit] = useState(30);
  const [note, setNote] = useState("");
  const [opening, setOpening] = useState<Book | null>(null);
  const openBook = (b: Book) => { setOpening(b); setTimeout(() => { setBook(b); setOpening(null); }, 1150); };

  useEffect(() => {
    if (!book) return;
    setData(null);
    setError(false);
    loadBook(book).then(setData).catch(() => setError(true));
  }, [book, tries]);

  useEffect(() => {
    if (!book || !section || !data) return;
    setItems(null);
    setError(false);
    setLimit(30);
    loadSection(book, data, section).then(setItems).catch(() => setError(true));
  }, [book, section, data, tries]);

  const share = async (h: Had) => {
    const r = await shareContent({
      title: `${book?.name} #${h.n}`,
      text: `${h.ar ? h.ar + "\n\n" : ""}${h.text}\n\n— ${book?.name}, Hadith ${h.n}\n\nLearn Islam app`,
    });
    setNote(r === "copied" ? "Copied!" : r === "failed" ? "Could not share" : "");
    setTimeout(() => setNote(""), 1500);
  };

  const langSwitch = (
    <div className="flex flex-wrap items-center justify-end gap-2 mb-4 text-sm">
      <span className="text-muted-foreground">{tx.read}:</span>
      {([["English", "en"], ["Roman Hindi", "rh"], ["Roman Telugu", "rt"]] as const).map(([label, v]) => (
        <button key={label} onClick={() => setLang(v)} className={`px-3 py-1 rounded-full border ${lang === v ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{label}</button>
      ))}
    </div>
  );

  if (!book) {
    return (
      <>
        {opening && <OpeningBook b={opening} />}
        {langSwitch}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-8 px-2 pt-2">
          {BOOKS.map((b) => (
            <motion.button key={b.id} onClick={() => openBook(b)} whileTap={{ scale: 0.96 }} whileHover={{ y: -4 }} className="relative aspect-[3/4] w-full" aria-label={b.name}>
              <Cover b={b} />
            </motion.button>
          ))}
          <p className="col-span-full text-xs text-muted-foreground italic text-center">
            Texts are loaded from the free open hadith-api project (fawazahmed0/hadith-api). Roman Hindi and Roman Telugu are AI translations of the English text; please check important meanings with a scholar.
          </p>
        </div>
      </>
    );
  }

  const back = () => {
    if (section) { setSection(null); setItems(null); setError(false); }
    else { setBook(null); setData(null); setError(false); }
  };

  return (
    <div>
      <button onClick={back} className="flex items-center gap-1 text-sm text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> {section ? book.name : tx.all}
      </button>
      {langSwitch}
      <h2 className="text-2xl font-serif text-primary mb-1">{book.name}</h2>
      {section && <p className="text-muted-foreground mb-4">{section.title}</p>}
      {data?.offline && !section && <p className="text-xs text-muted-foreground mb-3">{tx.offline}</p>}

      {error && (
        <div className="py-8 text-center">
          <p className="text-destructive mb-3">{tx.err}</p>
          <button onClick={() => setTries((n) => n + 1)} className="px-5 py-2 rounded-xl border border-border text-primary">{tx.retry}</button>
        </div>
      )}
      {!error && ((!section && !data) || (section && !items)) && (
        <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}

      {!section && data && (
        <div className="space-y-2 mt-3">
          {data.sections.map((s) => (
            <button key={s.no} onClick={() => setSection(s)} className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 text-left hover:border-primary/50">
              <span className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">{/^\d+$/.test(s.no) ? s.no : "★"}</span>
              <span className="flex-1">{s.title}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {section && items && (
        <div className="space-y-5">
          {items.slice(0, limit).map((h, i) => (
            <HadithCard key={`${h.n}-${i}`} h={h} book={book} lang={lang} tx={tx} onShare={share} note={note} />
          ))}
          {items.length === 0 && <p className="text-muted-foreground">{tx.empty}</p>}
          {limit < items.length && (
            <button onClick={() => setLimit(limit + 30)} className="w-full py-3 rounded-xl border border-border text-primary">
              {tx.load} ({items.length - limit} {tx.left})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
