import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeech } from '@/hooks/useSpeech';
import { AudioButton } from '@/components/AudioButton';
import { GoldenText } from '@/components/GoldenText';
import { IslamicDivider } from '@/components/IslamicDivider';
import { surahs } from '@/data/surahs';

const GOLD = '#D4AF37';

export default function Surahs() {
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();
  const [selectedId, setSelectedId] = useState<number>(surahs[0].number);
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  const selected = surahs.find(s => s.number === selectedId) ?? surahs[0];

  const getTheme = (s: typeof surahs[0]) =>
    language === 'roman-hindi' ? s.themeHi : language === 'roman-telugu' ? s.themeTe : s.theme;
  const getLesson = (s: typeof surahs[0]) =>
    language === 'roman-hindi' ? s.keyLessonHi : language === 'roman-telugu' ? s.keyLessonTe : s.virtualKeyLesson;

  const handleSpeak = (s: typeof surahs[0]) => {
    if (speakingId === s.number && isSpeaking) { stop(); setSpeakingId(null); return; }
    stop();
    const text = s.verses.map(v => `${v.transliteration}. ${v.english}`).join(' ');
    speak(text, language);
    setSpeakingId(s.number);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-3">Quran — Key Surahs</h1>
        <p className="text-2xl font-serif text-primary/70 mb-2" dir="rtl">سُوَرٌ مِنَ الْقُرْآنِ</p>
        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
          Essential surahs for memorization and daily recitation — with Arabic text, transliteration, and translation.
        </p>
      </div>

      <IslamicDivider />

      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar list */}
        <aside className="md:w-56 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-sans">Select Surah</p>
          <div className="space-y-1">
            {surahs.map(s => (
              <button
                key={s.number}
                data-testid={`surah-${s.number}`}
                onClick={() => setSelectedId(s.number)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                  selectedId === s.number
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="text-xs text-muted-foreground w-5 font-mono">{s.number === 255 ? '—' : s.number}</span>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-sans leading-tight truncate">
                    {s.nameEn.split(' — ')[0]}
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.ayahs} verse{s.ayahs !== 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-w-0"
          >
            {/* Surah header */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-sans ${
                      selected.revelation === 'Makki'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>{selected.revelation}</span>
                    <span className="text-xs text-muted-foreground font-sans">{selected.ayahs} verse{selected.ayahs !== 1 ? 's' : ''}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-serif text-primary">{selected.nameEn}</h2>
                  <p className="text-muted-foreground font-sans text-sm mt-1 leading-relaxed">{getTheme(selected)}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="text-2xl font-serif text-right" dir="rtl" style={{ fontFamily: "'Amiri', serif", color: GOLD }}>
                    {selected.nameAr}
                  </p>
                  <div onClick={e => e.stopPropagation()}>
                    <AudioButton
                      onClick={() => handleSpeak(selected)}
                      onStop={() => { stop(); setSpeakingId(null); }}
                      isSpeaking={speakingId === selected.number && isSpeaking}
                      volume={volume}
                      onVolumeChange={setVolume}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bismillah — for all except Al-Fatiha (already starts with it) and At-Tawbah */}
            {selected.number !== 1 && (
              <div className="text-center mb-4">
                <p className="text-xl font-serif text-primary/80" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5 italic">Bismillahir rahmanir raheem</p>
              </div>
            )}

            {/* Verses */}
            <div className="space-y-4">
              {selected.verses.map(verse => (
                <motion.div
                  key={verse.number}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  {/* Verse number badge + Arabic */}
                  <div className="p-4 bg-muted/20">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary font-sans shrink-0 mt-1">
                        {verse.number === 255 ? 'K' : verse.number}
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

                  {/* Transliteration */}
                  <div className="px-4 py-2 border-t border-border/50">
                    <p className="text-sm font-sans text-foreground/70 italic leading-relaxed">{verse.transliteration}</p>
                  </div>

                  {/* Translation */}
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-base font-sans text-foreground/90 leading-relaxed">{verse.english}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Key lesson */}
            <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary font-sans uppercase tracking-wider">Key Lesson</span>
              </div>
              <p className="text-base font-sans text-foreground/90 leading-relaxed">
                {language === 'en'
                  ? <>
                      {getLesson(selected).split(selected.nameEn.split(' — ')[0]).map((part, i, arr) => (
                        <span key={i}>{part}{i < arr.length - 1 && <GoldenText>{selected.nameEn.split(' — ')[0]}</GoldenText>}</span>
                      ))}
                    </>
                  : getLesson(selected)
                }
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
