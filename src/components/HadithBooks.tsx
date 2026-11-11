import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { shareContent } from "@/lib/share";

/**
 * Hadith "book edition" browser. Data is fetched on demand from the free,
 * open hadith-api (github.com/fawazahmed0/hadith-api, Unlicense) served by jsDelivr.
 * Only the six canonical collections + two small classics are listed.
 */
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

type Book = { id: string; name: string; arabic: string; by: string; from: string; to: string };
const BOOKS: Book[] = [
  { id: "bukhari", name: "Sahih al-Bukhari", arabic: "صحيح البخاري", by: "Imam al-Bukhari", from: "#14532d", to: "#052e16" },
  { id: "muslim", name: "Sahih Muslim", arabic: "صحيح مسلم", by: "Imam Muslim", from: "#7f1d1d", to: "#450a0a" },
  { id: "abudawud", name: "Sunan Abi Dawud", arabic: "سنن أبي داود", by: "Imam Abu Dawud", from: "#1e3a8a", to: "#172554" },
  { id: "tirmidhi", name: "Jami at-Tirmidhi", arabic: "جامع الترمذي", by: "Imam at-Tirmidhi", from: "#581c87", to: "#3b0764" },
  { id: "nasai", name: "Sunan an-Nasa'i", arabic: "سنن النسائي", by: "Imam an-Nasa'i", from: "#134e4a", to: "#042f2e" },
  { id: "ibnmajah", name: "Sunan Ibn Majah", arabic: "سنن ابن ماجه", by: "Imam Ibn Majah", from: "#78350f", to: "#451a03" },
  { id: "malik", name: "Muwatta Malik", arabic: "موطأ مالك", by: "Imam Malik", from: "#3f3f46", to: "#18181b" },
  { id: "nawawi", name: "40 Hadith of Nawawi", arabic: "الأربعون النووية", by: "Imam an-Nawawi", from: "#9a3412", to: "#431407" },
  { id: "qudsi", name: "40 Hadith Qudsi", arabic: "الأحاديث القدسية", by: "Compiled", from: "#0c4a6e", to: "#082f49" },
];

type Sec = { no: string; title: string; first?: number; last?: number };
type Had = { n: number; text: string; ar?: string; grade?: string; ref?: string };

const cache = new Map<string, any>();
async function getJson(url: string) {
  if (cache.has(url)) return cache.get(url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  const j = await r.json();
  cache.set(url, j);
  return j;
}

function parseSections(j: any): Sec[] {
  const names = j?.metadata?.section || {};
  const det = j?.metadata?.section_detail || {};
  return Object.keys(names)
    .filter((k) => k !== "0" && String(names[k]).trim() !== "")
    .map((k) => ({
      no: k,
      title: String(names[k]),
      first: det[k]?.hadithnumber_first,
      last: det[k]?.hadithnumber_last,
    }));
}

function gradeOf(h: any): string | undefined {
  const g = h?.grades;
  if (!Array.isArray(g) || !g.length) return undefined;
  return g.map((x: any) => `${x.grade}${x.name ? ` (${x.name})` : ""}`).join(", ");
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
  const [book, setBook] = useState<Book | null>(null);
  const [sections, setSections] = useState<Sec[] | null>(null);
  const [section, setSection] = useState<Sec | null>(null);
  const [items, setItems] = useState<Had[] | null>(null);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(30);
  const [note, setNote] = useState("");
  const [opening, setOpening] = useState<Book | null>(null);
  const openBook = (b: Book) => { setOpening(b); setTimeout(() => { setBook(b); setOpening(null); }, 1150); };

  useEffect(() => {
    if (!book) return;
    setSections(null);
    setError("");
    getJson(`${CDN}/eng-${book.id}/sections/0.json`)
      .then((j) => setSections(parseSections(j)))
      .catch(() => setError("Could not load this book. Check your internet connection."));
  }, [book]);

  useEffect(() => {
    if (!book || !section) return;
    setItems(null);
    setError("");
    setLimit(30);
    Promise.all([
      getJson(`${CDN}/eng-${book.id}/sections/${section.no}.json`),
      getJson(`${CDN}/ara-${book.id}/sections/${section.no}.json`).catch(() => null),
    ])
      .then(([en, ar]) => {
        const arMap = new Map<number, string>();
        (ar?.hadiths || []).forEach((h: any) => arMap.set(h.hadithnumber, h.text));
        setItems(
          (en.hadiths || []).map((h: any) => ({
            n: h.hadithnumber,
            text: h.text,
            ar: arMap.get(h.hadithnumber),
            grade: gradeOf(h),
            ref: h.reference ? `Book ${h.reference.book}, Hadith ${h.reference.hadith}` : undefined,
          })),
        );
      })
      .catch(() => setError("Could not load this chapter."));
  }, [book, section]);

  const share = async (h: Had) => {
    const r = await shareContent({
      title: `${book?.name} #${h.n}`,
      text: `${h.ar ? h.ar + "\n\n" : ""}${h.text}\n\n— ${book?.name}, Hadith ${h.n}\n\nLearn Islam app`,
    });
    setNote(r === "copied" ? "Copied!" : r === "failed" ? "Could not share" : "");
    setTimeout(() => setNote(""), 1500);
  };

  if (!book) {
    return (
      <>
        {opening && <OpeningBook b={opening} />}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-8 px-2 pt-2">
          {BOOKS.map((b) => (
            <motion.button
              key={b.id}
              onClick={() => openBook(b)}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -4 }}
              className="relative aspect-[3/4] w-full"
              aria-label={b.name}
            >
              <Cover b={b} />
            </motion.button>
          ))}
          <p className="col-span-full text-xs text-muted-foreground italic text-center">
            Texts are loaded live from the free open hadith-api project (fawazahmed0/hadith-api).
            Gradings shown are those given by the classical scholars named in the source data.
          </p>
        </div>
      </>
    );
  }

  const back = () => {
    if (section) { setSection(null); setItems(null); }
    else { setBook(null); setSections(null); }
  };

  return (
    <div>
      <button onClick={back} className="flex items-center gap-1 text-sm text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> {section ? book.name : "All books"}
      </button>
      <h2 className="text-2xl font-serif text-primary mb-1">{book.name}</h2>
      {section && <p className="text-muted-foreground mb-4">{section.title}</p>}
      {error && <p className="text-destructive py-6">{error}</p>}
      {!error && ((!section && !sections) || (section && !items)) && (
        <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}

      {!section && sections && (
        <div className="space-y-2 mt-3">
          {sections.map((s) => (
            <button
              key={s.no}
              onClick={() => setSection(s)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 text-left hover:border-primary/50"
            >
              <span className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">{s.no}</span>
              <span className="flex-1">{s.title}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {section && items && (
        <div className="space-y-5">
          {items.slice(0, limit).map((h) => (
            <div key={h.n} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-3">
                <span>{book.name} · Hadith {h.n}</span>
                <button onClick={() => share(h)} className="text-primary">{note || "Share"}</button>
              </div>
              {h.ar && (
                <p className="text-xl font-serif text-primary leading-loose text-right mb-3" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
                  {h.ar}
                </p>
              )}
              <p className="leading-relaxed">{h.text}</p>
              {(h.grade || h.ref) && (
                <p className="text-xs text-muted-foreground mt-3">
                  {h.grade && <>Grade: {h.grade}. </>}{h.ref}
                </p>
              )}
            </div>
          ))}
          {items.length === 0 && <p className="text-muted-foreground">No hadith in this chapter.</p>}
          {limit < items.length && (
            <button onClick={() => setLimit(limit + 30)} className="w-full py-3 rounded-xl border border-border text-primary">
              Load more ({items.length - limit} left)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
