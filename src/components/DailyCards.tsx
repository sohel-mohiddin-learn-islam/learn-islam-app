import { useEffect, useState } from "react";
import { getDailyHadith, getDailyVerse, type DailyHadith, type DailyVerse } from "@/lib/daily";
import { shareContent } from "@/lib/share";

function ShareLink({ text, className }: { text: string; className: string }) {
  const [label, setLabel] = useState("Share");
  return (
    <button
      onClick={async () => {
        const r = await shareContent({ text });
        if (r === "copied") { setLabel("Copied!"); setTimeout(() => setLabel("Share"), 2000); }
        else if (r === "failed") { setLabel("Try again"); setTimeout(() => setLabel("Share"), 2000); }
      }}
      className={className}
    >
      {label}
    </button>
  );
}

export function VerseCard() {
  const [v, setV] = useState<DailyVerse | null>(null);
  useEffect(() => { getDailyVerse().then(setV); }, []);
  return (
    <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-4 mb-5 border border-yellow-400/30 shadow-md">
      <p className="text-yellow-300 font-serif text-xs mb-2">Verse of the Day</p>
      {v ? (
        <>
          <p className="text-white text-xl leading-loose" dir="rtl" style={{ fontFamily: "'Amiri','Noto Naskh Arabic',serif" }}>{v.arabic}</p>
          <p className="text-emerald-100 text-sm mt-2 italic">"{v.english}"</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-emerald-200 text-xs">Qur'an — {v.ref}</p>
            <ShareLink text={`${v.arabic}\n\n"${v.english}"\n— Qur'an ${v.ref}\n\nLearn Islam app`} className="text-yellow-300 text-xs underline" />
          </div>
        </>
      ) : (
        <>
          <p className="text-white text-base font-serif leading-relaxed" dir="rtl">إن مع العسر يسرا</p>
          <p className="text-emerald-200 text-sm mt-2 italic">"Indeed, with hardship comes ease." — Quran 94:6</p>
        </>
      )}
    </div>
  );
}

export function HadithCard() {
  const [h, setH] = useState<DailyHadith | null>(null);
  useEffect(() => { getDailyHadith().then(setH); }, []);
  return (
    <div className="mt-5 bg-card border border-border rounded-2xl p-4 shadow-sm">
      <p className="text-primary font-serif text-xs mb-1">Hadith of the Day</p>
      {h ? (
        <>
          <p className="text-foreground font-serif text-sm leading-relaxed">{h.text}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-muted-foreground text-xs">{h.ref}</p>
            <ShareLink text={`${h.text}\n— ${h.ref}\n\nLearn Islam app`} className="text-primary text-xs underline" />
          </div>
        </>
      ) : (
        <>
          <p className="text-foreground font-serif text-sm leading-relaxed">"The best of you are those who learn the Quran and teach it."</p>
          <p className="text-muted-foreground text-xs mt-1">Prophet Muhammad (Bukhari)</p>
        </>
      )}
    </div>
  );
}
