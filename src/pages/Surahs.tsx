import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { AudioButton } from '@/components/AudioButton';
import { IslamicDivider } from '@/components/IslamicDivider';

const GOLD = '#D4AF37';

interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

interface Verse {
  number: number;
  arabic: string;
  transliteration: string;
  english: string;
}

const ARABIC_EDITION = 'quran-uthmani';
const TRANSLITERATION_EDITION = 'en.transliteration';
const TRANSLATION_EDITION = 'en.sahih';

export default function Surahs() {
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();

  const [surahList, setSurahList] = useState<SurahMeta[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  const [selectedNumber, setSelectedNumber] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [search, setSearch] = useState('');

  // Load the list of all 114 surahs once.
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(data => {
        if (data?.data) {
          setSurahList(data.data);
        } else {
          setListError(true);
        }
      })
      .catch(() => setListError(true))
      .finally(() => setListLoading(false));
  }, []);

  const loadSurah = useCallback((number: number) => {
    setVersesLoading(true);
    setVersesError(false);
    stop();
    setSpeaking(false);

    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${number}/${ARABIC_EDITION}`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/${TRANSLITERATION_EDITION}`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${number}/${TRANSLATION_EDITION}`).then(r => r.json()),
    ])
      .then(([arabicRes, translitRes, translationRes]) => {
        const arabicAyahs = arabicRes?.data?.ayahs;
        const translitAyahs = translitRes?.data?.ayahs;
        const translationAyahs = translationRes?.data?.ayahs;

        if (!arabicAyahs || !translationAyahs) {
          setVersesError(true);
          return;
        }

        const combined: Verse[] = arabicAyahs.map((a: any, i: number) => ({
          number: a.numberInSurah,
          arabic: a.text,
          transliteration: translitAyahs?.[i]?.text ?? '',
          english: translationAyahs[i]?.text ?? '',
        }));
        setVerses(combined);
      })
      .catch(() => setVersesError(true))
      .finally(() => setVersesLoading(false));
  }, [stop]);

  useEffect(() => {
    loadSurah(selectedNumber);
  }, [selectedNumber, loadSurah]);

  const selected = surahList.find(s => s.number === selectedNumber);

  const handleSpeak = () => {
    if (speaking && isSpeaking) {
      stop();
      setSpeaking(false);
      return;
    }
    stop();
    const text = verses.map(v => `${v.transliteration}. ${v.english}`).join(' ');
    speak(text, 'en');
    setSpeaking(true);
  };

  const filteredList = search.trim()
    ? surahList.filter(s =>
        s.englishName.toLowerCase().includes(search.toLowerCase()) ||
        s.englishNameTranslation.toLowerCase().includes(search.toLowerCase()) ||
        String(s.number).includes(search)
      )
    : surahList;

  // Bismillah is recited at the start of every surah except Al-Fatiha (1, already contains it) and At-Tawbah (9).
  const showBismillah = selectedNumber !== 1 && selectedNumber !== 9;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-3">The Holy Qur'an</h1>
        <p className="text-2xl font-serif text-primary/70 mb-2" dir="rtl">القرآن الكريم</p>
        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
          All 114 surahs, with Arabic text, transliteration, and translation.
        </p>
      </div>

      <IslamicDivider />

      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar list */}
        <aside className="md:w-64 shrink-0">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surah..."
              className="w-full bg-muted text-foreground text-sm rounded-lg pl-9 pr-3 py-2 border border-border font-sans"
            />
          </div>

          {listLoading && (
            <p className="text-sm text-muted-foreground font-sans px-1">Loading surah list…</p>
          )}
          {listError && (
            <p className="text-sm text-red-500 font-sans px-1">Couldn't load the surah list. Check your connection.</p>
          )}

          <div className="space-y-1 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
            {filteredList.map(s => (
              <button
                key={s.number}
                onClick={() => setSelectedNumber(s.number)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                  selectedNumber === s.number
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="text-xs text-muted-foreground w-6 font-mono shrink-0">{s.number}</span>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-sans leading-tight truncate">{s.englishName}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {s.englishNameTranslation} · {s.numberOfAyahs} verse{s.numberOfAyahs !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNumber}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-w-0"
          >
            {selected && (
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-sans ${
                        selected.revelationType === 'Meccan'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}>{selected.revelationType === 'Meccan' ? 'Makki' : 'Madani'}</span>
                      <span className="text-xs text-muted-foreground font-sans">
                        {selected.numberOfAyahs} verse{selected.numberOfAyahs !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold font-serif text-primary">{selected.englishName}</h2>
                    <p className="text-muted-foreground font-sans text-sm mt-1 leading-relaxed">
                      {selected.englishNameTranslation}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-2xl font-serif text-right" dir="rtl" style={{ fontFamily: "'Amiri', serif", color: GOLD }}>
                      {selected.name}
                    </p>
                    {verses.length > 0 && (
                      <div onClick={e => e.stopPropagation()}>
                        <AudioButton
                          onClick={handleSpeak}
                          onStop={() => { stop(); setSpeaking(false); }}
                          isSpeaking={speaking && isSpeaking}
                          volume={volume}
                          onVolumeChange={setVolume}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showBismillah && !versesLoading && verses.length > 0 && (
              <div className="text-center mb-4">
                <p className="text-xl font-serif text-primary/80" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5 italic">Bismillahir rahmanir raheem</p>
              </div>
            )}

            {versesLoading && (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-sans">Loading verses…</p>
              </div>
            )}

            {versesError && (
              <div className="text-center py-16">
                <p className="text-red-500 font-sans mb-3">Couldn't load this surah.</p>
                <button
                  onClick={() => loadSurah(selectedNumber)}
                  className="text-sm text-primary underline font-sans"
                >
                  Tap to retry
                </button>
              </div>
            )}

            {!versesLoading && !versesError && (
              <div className="space-y-4">
                {verses.map(verse => (
                  <div
                    key={verse.number}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <div className="p-4 bg-muted/20">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary font-sans shrink-0 mt-1">
                          {verse.number}
                        </span>
                        <p
                          className="flex-1 text-xl md:text-2xl font-serif leading-loose text-right"
                          dir="rtl"
                          style={{ fontFamily: "'Amiri', serif", color: GOLD }}
                        >
                          {verse.arabic}
                        </p>
                      </div>
                    </div>

                    {verse.transliteration && (
                      <div className="px-4 py-2 border-t border-border/50">
                        <p className="text-sm font-sans text-foreground/70 italic leading-relaxed">{verse.transliteration}</p>
                      </div>
                    )}

                    <div className="px-4 pb-4 pt-1">
                      <p className="text-base font-sans text-foreground/90 leading-relaxed">{verse.english}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!versesLoading && !versesError && verses.length > 0 && (
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm font-sans text-foreground/70">
                  Text provided by the Al Quran Cloud API.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
                                  }
