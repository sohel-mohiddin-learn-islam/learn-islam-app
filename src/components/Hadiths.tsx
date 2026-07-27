import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookMarked, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeech } from '@/hooks/useSpeech';
import { AudioButton } from '@/components/AudioButton';
import { GoldenText } from '@/components/GoldenText';
import { IslamicDivider } from '@/components/IslamicDivider';
import { hadiths, topicLabels, type HadithTopic } from '@/data/hadiths';

const ALL_TOPICS = Object.keys(topicLabels) as HadithTopic[];

export default function Hadiths() {
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState<HadithTopic | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const getText = (h: (typeof hadiths)[0]) => {
    if (language === 'roman-hindi') return h.romanHindi;
    if (language === 'roman-telugu') return h.romanTelugu;
    return h.english;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return hadiths.filter((h) => {
      const matchesTopic = activeTopic ? h.topic === activeTopic : true;
      if (!q) return matchesTopic;
      const text = getText(h).toLowerCase();
      const source = h.source.toLowerCase();
      return matchesTopic && (text.includes(q) || source.includes(q) || h.arabic.includes(search));
    });
  }, [search, activeTopic, language]);

  const handleSpeak = (h: (typeof hadiths)[0]) => {
    if (speakingId === h.id && isSpeaking) {
      stop();
      setSpeakingId(null);
    } else {
      stop();
      const text = `${getText(h)}. Source: ${h.source}.`;
      speak(text, language);
      setSpeakingId(h.id);
    }
  };

  const handleStop = () => {
    stop();
    setSpeakingId(null);
  };

  const renderHighlighted = (h: (typeof hadiths)[0]) => {
    const text = getText(h);
    if (language !== 'en' || !h.highlight) return <span>{text}</span>;
    const parts = text.split(h.highlight);
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <GoldenText>{h.highlight}</GoldenText>}
          </span>
        ))}
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center mb-10 relative">
        <h1 className="text-4xl md:text-6xl font-bold font-serif text-primary mb-3">
          Hadith Collection
        </h1>
        <p className="text-2xl font-serif text-primary/70 mb-2" dir="rtl">مجموعة الأحاديث</p>
        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
          Authentic hadith from Sahih Bukhari, Sahih Muslim, and other major collections — 
          organised by topic for easy learning and reflection.
        </p>
      </div>

      <IslamicDivider />

      {/* Search bar */}
      <div className="mt-8 mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          data-testid="hadith-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hadith by keyword or source…"
          className="w-full pl-12 pr-12 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans text-base"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Topic filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          data-testid="topic-all"
          onClick={() => setActiveTopic(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeTopic === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:border-primary/50 hover:text-primary'
          }`}
        >
          All Topics
        </button>
        {ALL_TOPICS.map((topic) => {
          const label = language === 'roman-hindi'
            ? topicLabels[topic].hi
            : language === 'roman-telugu'
            ? topicLabels[topic].te
            : topicLabels[topic].en;
          const isActive = activeTopic === topic;
          return (
            <button
              key={topic}
              data-testid={`topic-${topic}`}
              onClick={() => setActiveTopic(isActive ? null : topic)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : `${topicLabels[topic].color} border-transparent hover:border-current/30`
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-6 font-sans">
        {filtered.length} hadith{filtered.length !== 1 ? 's' : ''} found
        {activeTopic ? ` in ${topicLabels[activeTopic].en}` : ''}
        {search ? ` for "${search}"` : ''}
      </p>

      {/* Hadith cards */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 text-muted-foreground"
          >
            <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-sans">No hadith found. Try a different search or topic.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filtered.map((h, idx) => {
              const isThisPlaying = speakingId === h.id && isSpeaking;
              const topicLabel = language === 'roman-hindi'
                ? topicLabels[h.topic].hi
                : language === 'roman-telugu'
                ? topicLabels[h.topic].te
                : topicLabels[h.topic].en;

              return (
                <motion.div
                  key={h.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${topicLabels[h.topic].color}`}>
                        {topicLabel}
                      </span>
                      <span className="text-xs text-muted-foreground font-sans">{h.source}</span>
                    </div>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <AudioButton
                        onClick={() => handleSpeak(h)}
                        onStop={handleStop}
                        isSpeaking={isThisPlaying}
                        volume={volume}
                        onVolumeChange={setVolume}
                        data-testid={`audio-${h.id}`}
                      />
                    </div>
                  </div>

                  {/* Arabic text */}
                  <p
                    className="text-xl md:text-2xl font-serif text-primary leading-relaxed text-right mb-4"
                    dir="rtl"
                    style={{ fontFamily: "'Amiri', serif" }}
                  >
                    {h.arabic}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-border/50 my-4" />

                  {/* Translation */}
                  <p className="text-base font-sans text-foreground/90 leading-relaxed">
                    {renderHighlighted(h)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Footer note */}
      {filtered.length > 0 && (
        <div className="mt-12 text-center">
          <IslamicDivider className="mb-6 opacity-50" />
          <p className="text-sm text-muted-foreground font-sans italic">
            All hadith are sourced from authentic collections. For detailed chain of narration (isnad),
            please refer to the original hadith books.
          </p>
        </div>
      )}
    </div>
  );
}
