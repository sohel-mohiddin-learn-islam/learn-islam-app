import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeech } from '@/hooks/useSpeech';
import { AudioButton } from '@/components/AudioButton';
import { GoldenText } from '@/components/GoldenText';
import { IslamicDivider } from '@/components/IslamicDivider';
import { sahabah } from '@/data/sahabah';

function renderHighlighted(text: string, highlights: string[]) {
  if (!highlights.length) return <span>{text}</span>;
  const escaped = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        highlights.includes(part) ? <GoldenText key={i}>{part}</GoldenText> : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default function Sahabah() {
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();
  const [selectedId, setSelectedId] = useState<string>(sahabah[0].id);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'male' | 'female'>('all');

  const filtered = sahabah.filter(s => filter === 'all' || s.gender === filter);
  const selected = sahabah.find(s => s.id === selectedId) ?? sahabah[0];

  const getStory = (s: typeof sahabah[0]) =>
    language === 'roman-hindi' ? s.storyRomanHindi
    : language === 'roman-telugu' ? s.storyRomanTelugu
    : s.storyEn;

  const handleSpeak = (s: typeof sahabah[0]) => {
    if (speakingId === s.id && isSpeaking) { stop(); setSpeakingId(null); return; }
    stop();
    speak(getStory(s), language);
    setSpeakingId(s.id);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-3">Companions of the Prophet</h1>
        <p className="text-2xl font-serif text-primary/70 mb-2" dir="rtl">الصَّحَابَةُ الْكِرَام</p>
        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
          The Prophet (SAW) said: "My companions are like stars — whichever of them you follow, you will be rightly guided."
        </p>
      </div>

      <IslamicDivider />

      {/* Gender filter */}
      <div className="mt-8 flex gap-2 mb-6">
        {(['all', 'male', 'female'] as const).map(f => (
          <button
            key={f}
            data-testid={`filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/50'
            }`}
          >
            {f === 'all' ? 'All Companions' : f === 'male' ? 'Male Sahabah' : 'Female Sahabiyyat'}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-56 shrink-0">
          <div className="space-y-1">
            {filtered.map(s => (
              <button
                key={s.id}
                data-testid={`sahabi-${s.id}`}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  selectedId === s.id
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="block text-sm font-sans leading-tight">{s.nameEn.replace(' (RA)', '')}</span>
                <span className="block text-xs text-muted-foreground leading-tight mt-0.5 truncate">{s.titleEn.split(' — ')[0]}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-w-0"
          >
            {/* Header card */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-serif text-primary">{selected.nameEn}</h2>
                  <p className="text-muted-foreground font-sans text-sm mt-0.5">{selected.titleEn}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-2xl font-serif text-right" dir="rtl" style={{ fontFamily: "'Amiri', serif", color: '#D4AF37' }}>
                    {selected.nameAr}
                  </p>
                  <div onClick={e => e.stopPropagation()}>
                    <AudioButton
                      onClick={() => handleSpeak(selected)}
                      onStop={() => { stop(); setSpeakingId(null); }}
                      isSpeaking={speakingId === selected.id && isSpeaking}
                      volume={volume}
                      onVolumeChange={setVolume}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Story */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="prose prose-sm max-w-none">
                {getStory(selected).split('\n\n').map((para, i) => (
                  <p key={i} className="text-base font-sans text-foreground/90 leading-relaxed mb-4 last:mb-0">
                    {language === 'en' ? renderHighlighted(para, selected.highlights) : para}
                  </p>
                ))}
              </div>
            </div>

            {/* Key lesson */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary font-sans uppercase tracking-wider">Key Lesson</span>
              </div>
              <p className="text-base font-sans text-foreground/90 leading-relaxed">{selected.keyLesson}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
