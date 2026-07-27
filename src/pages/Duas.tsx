import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeech } from '@/hooks/useSpeech';
import { AudioButton } from '@/components/AudioButton';
import { GoldenText } from '@/components/GoldenText';
import { IslamicDivider } from '@/components/IslamicDivider';
import { duas, occasionLabels, type DuaOccasion } from '@/data/duas';

const ALL_OCCASIONS = Object.keys(occasionLabels) as DuaOccasion[];

export default function Duas() {
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();
  const [activeOccasion, setActiveOccasion] = useState<DuaOccasion | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const getText = (d: (typeof duas)[0]) => {
    if (language === 'roman-hindi') return d.romanHindi;
    if (language === 'roman-telugu') return d.romanTelugu;
    return d.english;
  };

  const getTitle = (d: (typeof duas)[0]) => {
    if (language === 'roman-hindi') return d.titleHi;
    if (language === 'roman-telugu') return d.titleTe;
    return d.titleEn;
  };

  const filtered = useMemo(() =>
    activeOccasion ? duas.filter(d => d.occasion === activeOccasion) : duas,
    [activeOccasion]
  );

  const handleSpeak = (d: (typeof duas)[0]) => {
    if (speakingId === d.id && isSpeaking) { stop(); setSpeakingId(null); return; }
    stop();
    const text = `${getTitle(d)}. ${d.transliteration}. ${getText(d)}`;
    speak(text, language);
    setSpeakingId(d.id);
  };

  const renderHighlighted = (text: string, highlight: string) => {
    if (language !== 'en' || !highlight) return <span>{text}</span>;
    const parts = text.split(highlight);
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>{part}{i < parts.length - 1 && <GoldenText>{highlight}</GoldenText>}</span>
        ))}
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-bold font-serif text-primary mb-3">Du'a Library</h1>
        <p className="text-2xl font-serif text-primary/70 mb-2" dir="rtl">مكتبة الأدعية</p>
        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
          Authentic supplications from the Quran and Sunnah for every moment of your day.
        </p>
      </div>

      <IslamicDivider />

      {/* Occasion filter */}
      <div className="mt-8 mb-8">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-sans">Filter by Occasion</p>
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="occasion-all"
            onClick={() => setActiveOccasion(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeOccasion === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/50'
            }`}
          >
            All Du'as
          </button>
          {ALL_OCCASIONS.map(occ => {
            const lbl = occasionLabels[occ];
            const isActive = activeOccasion === occ;
            return (
              <button
                key={occ}
                data-testid={`occasion-${occ}`}
                onClick={() => setActiveOccasion(isActive ? null : occ)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                  isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/50 hover:text-primary'
                }`}
              >
                <span>{lbl.icon}</span>
                <span>{language === 'roman-hindi' ? lbl.hi : language === 'roman-telugu' ? lbl.te : lbl.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6 font-sans">
        {filtered.length} du'a{filtered.length !== 1 ? 's' : ''}
        {activeOccasion ? ` for ${occasionLabels[activeOccasion].en}` : ''}
      </p>

      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {filtered.map((dua, idx) => {
            const isExpanded = expandedId === dua.id;
            const isThisPlaying = speakingId === dua.id && isSpeaking;
            const occ = occasionLabels[dua.occasion];

            return (
              <motion.div
                key={dua.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.25) }}
                className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Header — always visible */}
                <button
                  data-testid={`dua-toggle-${dua.id}`}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : dua.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-base">{occ.icon}</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {language === 'roman-hindi' ? occ.hi : language === 'roman-telugu' ? occ.te : occ.en}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold font-serif text-foreground leading-tight">{getTitle(dua)}</h3>
                    {/* Arabic preview */}
                    <p className="text-primary font-serif text-lg mt-2 text-right" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
                      {dua.arabic.length > 60 ? dua.arabic.slice(0, 60) + '…' : dua.arabic}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <div onClick={e => e.stopPropagation()}>
                      <AudioButton onClick={() => handleSpeak(dua)} onStop={() => { stop(); setSpeakingId(null); }} isSpeaking={isThisPlaying} volume={volume} onVolumeChange={setVolume} />
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                        {/* Full Arabic */}
                        <div className="bg-muted/40 rounded-xl p-4">
                          <p className="text-xl md:text-2xl font-serif text-primary leading-relaxed text-right" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
                            {dua.arabic}
                          </p>
                        </div>

                        {/* Transliteration */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Transliteration</p>
                          <p className="text-sm font-sans text-foreground/80 italic leading-relaxed">{dua.transliteration}</p>
                        </div>

                        {/* Translation */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {language === 'roman-hindi' ? 'Roman Hindi' : language === 'roman-telugu' ? 'Roman Telugu' : 'Translation'}
                          </p>
                          <p className="text-base font-sans text-foreground/90 leading-relaxed">
                            {renderHighlighted(getText(dua), dua.highlight)}
                          </p>
                        </div>

                        {/* Reference */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-sans bg-muted px-3 py-1 rounded-full">{dua.reference}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      <div className="mt-12">
        <IslamicDivider className="opacity-50 mb-6" />
        <p className="text-center text-sm text-muted-foreground font-sans italic">
          The Prophet (SAW) said: "Du'a is the essence of worship." Call upon Allah — He is always listening.
        </p>
      </div>
    </div>
  );
}
