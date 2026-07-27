import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { IslamicDivider } from '@/components/IslamicDivider';
import { GoldenText } from '@/components/GoldenText';
import { asmaulHusna } from '@/data/asmaulHusna';

const GOLD = '#D4AF37';

export default function AsmaulHusna() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof asmaulHusna[0] | null>(null);

  const filtered = asmaulHusna.filter(n => {
    const q = search.toLowerCase();
    return !q || n.meaning.toLowerCase().includes(q) || n.transliteration.toLowerCase().includes(q) || n.arabic.includes(search);
  });

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-3">99 Names of Allah</h1>
        <p className="text-2xl font-serif text-primary/70 mb-2" dir="rtl">أَسْمَاءُ اللَّهِ الْحُسْنَى</p>
        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
          The Prophet (SAW) said: "Allah has ninety-nine names. Whoever memorises them will enter Paradise."
          (Sahih Bukhari 2736)
        </p>
      </div>

      <IslamicDivider />

      {/* Quranic verse */}
      <div className="mt-8 mb-8 bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-xl md:text-2xl font-serif leading-relaxed text-right mb-3" dir="rtl" style={{ fontFamily: "'Amiri', serif", color: GOLD }}>
          وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا
        </p>
        <p className="text-sm text-muted-foreground font-sans italic">
          "And to Allah belong the best names, so invoke Him by them." — Quran 7:180
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          data-testid="asmaul-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or meaning…"
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-6 font-sans">{filtered.length} names found</p>

      {/* Grid of names */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((name, idx) => (
          <motion.button
            key={name.number}
            data-testid={`name-${name.number}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: Math.min(idx * 0.01, 0.4) }}
            onClick={() => setSelected(selected?.number === name.number ? null : name)}
            className={`group relative rounded-xl border p-3 text-center transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
              selected?.number === name.number
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <span className="text-xs text-muted-foreground font-sans font-medium block mb-1">
              {String(name.number).padStart(2, '0')}
            </span>
            <p
              className="text-lg font-serif leading-tight mb-1"
              dir="rtl"
              style={{ fontFamily: "'Amiri', serif", color: GOLD }}
            >
              {name.arabic}
            </p>
            <p className="text-xs font-sans font-medium text-foreground/80 leading-tight">{name.transliteration}</p>
            <p className="text-xs font-sans text-muted-foreground leading-tight mt-0.5 truncate">{name.meaning}</p>
          </motion.button>
        ))}
      </div>

      {/* Expanded detail panel */}
      {selected && (
        <motion.div
          key={selected.number}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-8 bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs text-muted-foreground font-sans font-semibold uppercase tracking-wider">Name #{selected.number}</span>
              <h2 className="text-3xl font-bold font-serif text-primary mt-1">{selected.transliteration}</h2>
              <p className="text-lg font-sans text-foreground/70 mt-0.5">{selected.meaning}</p>
            </div>
            <div className="text-right">
              <p
                className="text-3xl md:text-4xl font-serif"
                dir="rtl"
                style={{ fontFamily: "'Amiri', serif", color: GOLD }}
              >
                {selected.arabic}
              </p>
            </div>
          </div>
          <IslamicDivider className="my-4 opacity-40" />
          <p className="text-base font-sans text-foreground/90 leading-relaxed">{selected.explanation}</p>
          <button
            onClick={() => setSelected(null)}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground font-sans underline"
          >
            Close
          </button>
        </motion.div>
      )}

      <div className="mt-12">
        <IslamicDivider className="opacity-50 mb-6" />
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="font-serif text-primary text-lg mb-1">اللَّهُمَّ إِنِّي أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ</p>
          <p className="text-sm text-muted-foreground font-sans italic">
            "O Allah, I ask You by every name that is Yours…"
          </p>
        </div>
      </div>
    </div>
  );
}
