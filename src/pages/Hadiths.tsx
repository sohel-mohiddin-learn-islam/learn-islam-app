
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  ChevronRight,
  Search,
  X,
  Library,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeech } from '@/hooks/useSpeech';
import { AudioButton } from '@/components/AudioButton';
import { GoldenText } from '@/components/GoldenText';
import { IslamicDivider } from '@/components/IslamicDivider';
import { hadiths, topicLabels, type HadithTopic } from '@/data/hadiths';

const ALL_TOPICS = Object.keys(topicLabels) as HadithTopic[];

const BOOK_STYLES = [
  { cover: 'from-emerald-950 via-emerald-800 to-emerald-950', trim: 'border-amber-400/70', ornament: '✦' },
  { cover: 'from-stone-900 via-amber-950 to-stone-900', trim: 'border-yellow-500/70', ornament: '۞' },
  { cover: 'from-teal-950 via-teal-800 to-teal-950', trim: 'border-yellow-400/70', ornament: '❋' },
  { cover: 'from-indigo-950 via-indigo-800 to-indigo-950', trim: 'border-amber-300/70', ornament: '✧' },
  { cover: 'from-rose-950 via-rose-800 to-rose-950', trim: 'border-amber-400/70', ornament: '۞' },
];

type HadithEntry = (typeof hadiths)[number];

export default function Hadiths() {
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();

  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState<HadithTopic | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<HadithTopic | null>(null);
  const [openedHadith, setOpenedHadith] = useState<string | null>(null);

  const getText = (h: HadithEntry) => {
    if (language === 'roman-hindi') return h.romanHindi;
    if (language === 'roman-telugu') return h.romanTelugu;
    return h.english;
  };

  const getTopicLabel = (topic: HadithTopic) => {
    if (language === 'roman-hindi') return topicLabels[topic].hi;
    if (language === 'roman-telugu') return topicLabels[topic].te;
    return topicLabels[topic].en;
  };

  // Group only by the actual collection names in the existing data.
  const books = useMemo(() => {
    const groups = new Map<string, HadithEntry[]>();

    for (const h of hadiths) {
      const entries = groups.get(h.source.split(/\s+\d+$/)[0]) ?? [];
      entries.push(h);
      groups.set(h.source.split(/\s+\d+$/)[0], entries);
    }

    return Array.from(groups.entries())
      .map(([name, entries]) => ({ name, entries }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const currentBook = books.find((book) => book.name === selectedBook);

  const bookEntries = useMemo(() => {
    if (!currentBook) return [];
    return currentBook.entries.filter((h) => {
      const matchesTopic = selectedChapter ? h.topic === selectedChapter : true;
      const q = search.toLowerCase().trim();

      if (!q) return matchesTopic;

      return (
        matchesTopic &&
        (
          getText(h).toLowerCase().includes(q) ||
          h.source.toLowerCase().includes(q) ||
          h.arabic.includes(search) ||
          h.highlight.toLowerCase().includes(q)
        )
      );
    });
  }, [currentBook, selectedChapter, search, language]);

  const bookshelfBooks = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return books;

    return books.filter(
      (book) =>
        book.name.toLowerCase().includes(q) ||
        book.entries.some(
          (h) =>
            getText(h).toLowerCase().includes(q) ||
            h.source.toLowerCase().includes(q) ||
            h.arabic.includes(search)
        )
    );
  }, [books, search, language]);

  const chapters = useMemo(() => {
    const entries = currentBook?.entries ?? [];
    return ALL_TOPICS
      .map((topic) => ({
        topic,
        entries: entries.filter((h) => h.topic === topic),
      }))
      .filter((chapter) => chapter.entries.length > 0);
  }, [currentBook]);

  const handleSpeak = (h: HadithEntry) => {
    if (speakingId === h.id && isSpeaking) {
      stop();
      setSpeakingId(null);
      return;
    }

    stop();
    speak(`${getText(h)}. Source: ${h.source}.`, language);
    setSpeakingId(h.id);
  };

  const handleStop = () => {
    stop();
    setSpeakingId(null);
  };

  const renderHighlighted = (h: HadithEntry) => {
    const text = getText(h);
    if (language !== 'en' || !h.highlight || !text.includes(h.highlight)) {
      return <span>{text}</span>;
    }

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

  const goToBookshelf = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    setOpenedHadith(null);
    setActiveTopic(null);
    setSearch('');
  };

  const openBook = (name: string) => {
    setSelectedBook(name);
    setSelectedChapter(null);
    setOpenedHadith(null);
    setSearch('');
  };

  const selectedHadith = bookEntries.find((h) => h.id === openedHadith);

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 md:px-10 md:py-12">
      <header className="relative mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-emerald-950 text-amber-300 shadow-lg">
          <Library className="h-7 w-7" />
        </div>
        <h1 className="mb-2 font-serif text-4xl font-bold text-primary md:text-5xl">
          Hadith Library
        </h1>
        <p className="mb-2 font-serif text-2xl text-primary/70" dir="rtl">
          مكتبة الحديث
        </p>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          Explore collections, browse chapters, and read the teachings in your preferred language.
        </p>
        <div className="mt-4 flex justify-center">
          <IslamicDivider />
        </div>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          data-testid="hadith-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selectedBook ? `Search in ${selectedBook}…` : 'Search collections or Hadiths…'}
          className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button
            aria-label="Clear search"
            data-testid="clear-search"
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedBook ? (
          <motion.section
            key="bookshelf"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                  The collection
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">
                  Choose a book
                </h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {bookshelfBooks.length} {bookshelfBooks.length === 1 ? 'book' : 'books'}
              </span>
            </div>

            {bookshelfBooks.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card py-12 text-center text-muted-foreground">
                No books or Hadiths matched your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {bookshelfBooks.map((book, index) => {
                  const style = BOOK_STYLES[index % BOOK_STYLES.length];

                  return (
                    <motion.button
                      key={book.name}
                      data-testid={`hadith-book-${index}`}
                      onClick={() => openBook(book.name)}
                      whileHover={{ y: -5, rotateY: -3 }}
                      whileTap={{ scale: 0.97 }}
                      className="group text-left"
                    >
                      <div className={`relative min-h-56 overflow-hidden rounded-r-xl rounded-l-md border-l-[7px] border-amber-950/80 bg-gradient-to-br ${style.cover} p-3 shadow-lg transition-shadow group-hover:shadow-xl`}>
                        <div className={`flex h-full min-h-48 flex-col items-center justify-center rounded-md border ${style.trim} px-2 py-4 text-center`}>
                          <span className="mb-3 text-3xl text-amber-300">{style.ornament}</span>
                          <div className="mb-3 h-px w-10 bg-amber-400/70" />
                          <BookOpen className="mb-3 h-7 w-7 text-amber-200" />
                          <h3 className="font-serif text-sm font-bold leading-snug text-amber-50 sm:text-base">
                            {book.name}
                          </h3>
                          <div className="my-3 h-px w-10 bg-amber-400/70" />
                          <span className="text-xs text-amber-100/80">
                            {book.entries.length} {book.entries.length === 1 ? 'entry' : 'entries'}
                          </span>
                          <span className="mt-3 text-[10px] uppercase tracking-[0.16em] text-amber-200/70">
                            Open book
                          </span>
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/15 to-transparent" />
                      </div>
                      <p className="mt-2 line-clamp-2 text-center text-xs text-muted-foreground">
                        {book.entries.length} available in this app
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <div className="mt-8 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              <BookMarked className="mb-2 h-5 w-5 text-primary" />
              This library currently contains {hadiths.length} entries across {books.length} collection labels. Counts show entries available in this app, not the total number of Hadiths in the original books.
            </div>
          </motion.section>
        ) : (
          <motion.section
            key={selectedBook}
            initial={{ opacity: 0, rotateY: -12, x: 24 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            exit={{ opacity: 0, rotateY: 10, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ transformPerspective: 1200 }}
          >
            <button
              onClick={goToBookshelf}
              className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to bookshelf
            </button>

            <div className="mb-6 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 p-5 text-amber-50 shadow-lg sm:p-7">
              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ rotateY: -75, scale: 0.8 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left center', transformPerspective: 800 }}
                  className="flex h-24 w-16 shrink-0 items-center justify-center rounded-r-lg rounded-l-sm border border-amber-300/70 bg-gradient-to-br from-emerald-700 to-emerald-950 shadow-xl"
                >
                  <BookOpen className="h-8 w-8 text-amber-200" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-amber-200/80">
                    Selected collection
                  </p>
                  <h2 className="font-serif text-2xl font-bold sm:text-3xl">
                    {currentBook?.name}
                  </h2>
                  <p className="mt-2 text-sm text-amber-100/80">
                    {currentBook?.entries.length ?? 0} entries available in this app
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-7">
              <h3 className="mb-3 font-serif text-xl font-bold text-foreground">
                Chapters
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setSelectedChapter(null)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                    selectedChapter === null
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="font-medium">All chapters</span>
                  <span className="text-sm text-muted-foreground">
                    {currentBook?.entries.length ?? 0}
                  </span>
                </button>
                {chapters.map(({ topic, entries }) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSelectedChapter(selectedChapter === topic ? null : topic);
                      setOpenedHadith(null);
                    }}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selectedChapter === topic
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${topicLabels[topic].color}`}>
                      {getTopicLabel(topic)}
                    </span>
                    <span className="text-sm text-muted-foreground">{entries.length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-serif text-xl font-bold text-foreground">
                {selectedChapter ? getTopicLabel(selectedChapter) : 'Hadith entries'}
              </h3>
              <span className="text-sm text-muted-foreground">
                {bookEntries.length} found
              </span>
            </div>

            {bookEntries.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                No entries match this search.
              </div>
            ) : (
              <div className="space-y-4">
                {bookEntries.map((h, index) => {
                  const isThisPlaying = speakingId === h.id && isSpeaking;
                  const isOpen = openedHadith === h.id;

                  return (
                    <motion.article
                      key={h.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.2) }}
                      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                    >
                      <button
                        onClick={() => setOpenedHadith(isOpen ? null : h.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 p-4 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-muted-foreground">{h.source}</span>
                          <span className="mt-1 block font-serif text-base font-semibold text-foreground">
                            {h.highlight || getText(h).slice(0, 72)}
                          </span>
                        </span>
                        <ChevronRight className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border/60 p-4 sm:p-6">
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${topicLabels[h.topic].color}`}>
                                  {getTopicLabel(h.topic)}
                                </span>
                                <AudioButton
                                  onClick={() => handleSpeak(h)}
                                  onStop={handleStop}
                                  isSpeaking={isThisPlaying}
                                  volume={volume}
                                  onVolumeChange={setVolume}
                                  data-testid={`audio-${h.id}`}
                                />
                              </div>

                              <p
                                className="mb-5 text-right font-serif text-2xl leading-loose text-primary sm:text-3xl"
                                dir="rtl"
                                lang="ar"
                                style={{ fontFamily: "'Amiri', serif" }}
                              >
                                {h.arabic}
                              </p>

                              <div className="mb-4 border-t border-border/60" />

                              <p className="text-base leading-8 text-foreground/90">
                                {renderHighlighted(h)}
                              </p>

                              <p className="mt-5 text-xs text-muted-foreground">
                                Reference shown in the current app data: {h.source}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </div>
            )}

            <div className="mt-8">
              <IslamicDivider />
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                References and translations should be checked against the original collections. Entry counts here describe the current app data only.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
