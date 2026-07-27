import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Moon, Sun, Heart, Award, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { useLanguage } from '@/contexts/LanguageContext';
import { AudioButton } from '@/components/AudioButton';

type LangKey = 'en' | 'roman-hindi' | 'roman-telugu';

interface Tri {
  en: string;
  'roman-hindi': string;
  'roman-telugu': string;
}

const t = (obj: Tri, lang: LangKey) => obj[lang];

const pillars: { title: Tri; desc: Tri; color: string; emoji: string }[] = [
  {
    title: { en: 'Shahadah', 'roman-hindi': 'Shahadah', 'roman-telugu': 'Shahadah' },
    desc: {
      en: 'Belief in One Allah & His Messenger Muhammad (SAW)',
      'roman-hindi': 'Ek Allah aur unke Rasool Muhammad (SAW) par imaan lana',
      'roman-telugu': 'Oka Allah mariyu ayana Rasool Muhammad (SAW) pai nammakam',
    },
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    emoji: '🌙',
  },
  {
    title: { en: 'Salah', 'roman-hindi': 'Salah (Namaz)', 'roman-telugu': 'Salah (Namaz)' },
    desc: {
      en: 'Praying 5 times a day — Fajr, Zuhr, Asr, Maghrib, Isha',
      'roman-hindi': 'Din mein 5 baar namaz parhna — Fajr, Zuhr, Asr, Maghrib, Isha',
      'roman-telugu': 'Roju 5 sarlu namaz chaduvutaamu — Fajr, Zuhr, Asr, Maghrib, Isha',
    },
    color: 'bg-green-100 text-green-700 border-green-300',
    emoji: '🕌',
  },
  {
    title: { en: 'Zakat', 'roman-hindi': 'Zakat', 'roman-telugu': 'Zakat' },
    desc: {
      en: 'Giving charity — sharing wealth with those in need',
      'roman-hindi': 'Sadqa dena — zarooratamandon ke saath daulat baantna',
      'roman-telugu': 'Daridrulaaku daanam iyyataamu — sampada panchu kovaṭamu',
    },
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    emoji: '💛',
  },
  {
    title: { en: 'Sawm', 'roman-hindi': 'Sawm (Roza)', 'roman-telugu': 'Sawm (Upavasam)' },
    desc: {
      en: 'Fasting in the blessed month of Ramadan',
      'roman-hindi': 'Mubarak maheena Ramadan mein roza rakhna',
      'roman-telugu': 'Pavitramaina Ramadan maasamlō upavasam undaṭamu',
    },
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    emoji: '⭐',
  },
  {
    title: { en: 'Hajj', 'roman-hindi': 'Hajj', 'roman-telugu': 'Hajj' },
    desc: {
      en: 'Pilgrimage to the holy city of Makkah — once in a lifetime',
      'roman-hindi': 'Muqaddas shehar Makkah ki ziyarat — zindagi mein ek baar',
      'roman-telugu': 'Pavitra nagaram Makkah ki teertha yatra — jiivitamlo okasari',
    },
    color: 'bg-pink-100 text-pink-700 border-pink-300',
    emoji: '🕋',
  },
];

const alphabet = [
  { ar: 'أ', en: 'Alif', rh: 'Alif', rt: 'Alif', word: { en: 'Allah', 'roman-hindi': 'Allah', 'roman-telugu': 'Allah' } },
  { ar: 'ب', en: 'Ba', rh: 'Ba', rt: 'Ba', word: { en: 'Bait (House)', 'roman-hindi': 'Bait (Ghar)', 'roman-telugu': 'Bait (Illu)' } },
  { ar: 'ت', en: 'Ta', rh: 'Ta', rt: 'Ta', word: { en: 'Tuffah (Apple)', 'roman-hindi': 'Tuffah (Seb)', 'roman-telugu': 'Tuffah (Apple)' } },
  { ar: 'ث', en: 'Tha', rh: 'Tha', rt: 'Tha', word: { en: 'Thawb (Robe)', 'roman-hindi': 'Thawb (Kapda)', 'roman-telugu': 'Thawb (Vastra)' } },
  { ar: 'ج', en: 'Jim', rh: 'Jim', rt: 'Jim', word: { en: 'Jamal (Camel)', 'roman-hindi': 'Jamal (Oont)', 'roman-telugu': 'Jamal (Oonta)' } },
  { ar: 'ح', en: 'Ha', rh: 'Ha', rt: 'Ha', word: { en: 'Hawa (Eve)', 'roman-hindi': 'Hawa (Bibi)', 'roman-telugu': 'Hawa (Eve)' } },
  { ar: 'خ', en: 'Kha', rh: 'Kha', rt: 'Kha', word: { en: 'Khubz (Bread)', 'roman-hindi': 'Khubz (Roti)', 'roman-telugu': 'Khubz (Roti)' } },
  { ar: 'د', en: 'Dal', rh: 'Dal', rt: 'Dal', word: { en: 'Dawa (Medicine)', 'roman-hindi': 'Dawa (Dawai)', 'roman-telugu': 'Dawa (Mandu)' } },
];

interface Dua {
  title: Tri;
  arabic: string;
  phonetic: string;
  meaning: Tri;
  icon: typeof Sun;
  color: string;
}

const duas: Dua[] = [
  {
    title: { en: 'Before Sleeping', 'roman-hindi': 'Sone se Pehle', 'roman-telugu': 'Nidrapōye Mundhu' },
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    phonetic: 'Bismika Allahumma amutu wa ahya',
    meaning: {
      en: 'In Your name O Allah, I die and I live.',
      'roman-hindi': 'Tere naam se ai Allah, marta hoon aur jeeta hoon.',
      'roman-telugu': 'Nee paeruna ya Allah, chastaanu mariyu batakaanu.',
    },
    icon: Moon,
    color: 'border-blue-300 bg-blue-50',
  },
  {
    title: { en: 'Before Eating', 'roman-hindi': 'Khaane se Pehle', 'roman-telugu': 'Tinavale Mundhu' },
    arabic: 'بِسْمِ اللَّهِ',
    phonetic: 'Bismillah',
    meaning: {
      en: 'In the name of Allah.',
      'roman-hindi': 'Allah ke naam se.',
      'roman-telugu': 'Allah paeruna.',
    },
    icon: Heart,
    color: 'border-green-300 bg-green-50',
  },
  {
    title: { en: 'After Eating', 'roman-hindi': 'Khaane ke Baad', 'roman-telugu': 'Tina Tharvaata' },
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي',
    phonetic: 'Alhamdulillahil lazi at-amani',
    meaning: {
      en: 'Praise be to Allah who has fed me.',
      'roman-hindi': 'Shukar hai Allah ka jisne mujhe khana khilaya.',
      'roman-telugu': 'Allah ki sthuthi, aayana naku taninchaaḍu.',
    },
    icon: Sun,
    color: 'border-yellow-300 bg-yellow-50',
  },
  {
    title: { en: 'On Waking Up', 'roman-hindi': 'Neend se Uthte Waqt', 'roman-telugu': 'Melukoone Samayamlo' },
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا',
    phonetic: 'Alhamdulillahil lazi ahyana ba\'da ma amatana',
    meaning: {
      en: 'Praise be to Allah who gave us life after death (sleep).',
      'roman-hindi': 'Shukar hai Allah ka jisne maut (neend) ke baad zindagi di.',
      'roman-telugu': 'Allah ki sthuthi, aayana nidrataravata maaku jeevitam ichcchaaḍu.',
    },
    icon: Star,
    color: 'border-orange-300 bg-orange-50',
  },
];

interface QuizQuestion {
  question: Tri;
  options: { label: Tri; correct: boolean }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    question: {
      en: 'How many times do we pray every day?',
      'roman-hindi': 'Hum roz kitni baar namaz padhte hain?',
      'roman-telugu': 'Manam roju enni sarlu namaz chaduvutaamu?',
    },
    options: [
      { label: { en: '3 Prayers', 'roman-hindi': '3 Namaz', 'roman-telugu': '3 Namazlu' }, correct: false },
      { label: { en: '5 Prayers', 'roman-hindi': '5 Namaz', 'roman-telugu': '5 Namazlu' }, correct: true },
    ],
  },
  {
    question: {
      en: 'Who was the first Prophet of Allah?',
      'roman-hindi': 'Allah ke pehle Nabi kaun the?',
      'roman-telugu': 'Allah yokka mottama Nabi evaru?',
    },
    options: [
      { label: { en: 'Nabi Musa (AS)', 'roman-hindi': 'Nabi Musa (AS)', 'roman-telugu': 'Nabi Musa (AS)' }, correct: false },
      { label: { en: 'Nabi Adam (AS)', 'roman-hindi': 'Nabi Adam (AS)', 'roman-telugu': 'Nabi Adam (AS)' }, correct: true },
    ],
  },
  {
    question: {
      en: 'How many pillars of Islam are there?',
      'roman-hindi': 'Islam ke kitne arkan hain?',
      'roman-telugu': 'Islam lo enni stambhalu unnayi?',
    },
    options: [
      { label: { en: '3 Pillars', 'roman-hindi': '3 Arkan', 'roman-telugu': '3 Stambhalu' }, correct: false },
      { label: { en: '5 Pillars', 'roman-hindi': '5 Arkan', 'roman-telugu': '5 Stambhalu' }, correct: true },
    ],
  },
  {
    question: {
      en: 'What is the holy book of Islam?',
      'roman-hindi': 'Islam ki muqaddas kitab kaunsi hai?',
      'roman-telugu': 'Islam yokka pavitra grandham eedi?',
    },
    options: [
      { label: { en: 'The Quran', 'roman-hindi': 'Quran', 'roman-telugu': 'Quran' }, correct: true },
      { label: { en: 'The Bible', 'roman-hindi': 'Bible', 'roman-telugu': 'Bible' }, correct: false },
    ],
  },
  {
    question: {
      en: 'Who was the last and final Prophet of Allah?',
      'roman-hindi': 'Allah ke aakhri aur akhiri Nabi kaun the?',
      'roman-telugu': 'Allah yokka chethi Nabi evaru?',
    },
    options: [
      { label: { en: 'Prophet Isa (AS)', 'roman-hindi': 'Hazrat Isa (AS)', 'roman-telugu': 'Hazrat Isa (AS)' }, correct: false },
      { label: { en: 'Prophet Muhammad (SAW)', 'roman-hindi': 'Hazrat Muhammad (SAW)', 'roman-telugu': 'Hazrat Muhammad (SAW)' }, correct: true },
    ],
  },
];

export default function KidsZone() {
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();
  const lang = language as LangKey;

  const [celebrate, setCelebrate] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [score, setScore] = useState(0);

  const handleSpeak = (text: string) => {
    if (isSpeaking) { stop(); return; }
    speak(text, lang);
  };

  const handleAnswer = (correct: boolean) => {
    if (answered !== null) return;
    setAnswered(correct);
    if (correct) {
      setCelebrate(true);
      setScore(s => s + 1);
      speak(
        lang === 'en' ? "Masha Allah! Correct answer!" :
        lang === 'roman-hindi' ? "Masha Allah! Sahi jawab!" :
        "Masha Allah! Correct jawabu!",
        lang
      );
      setTimeout(() => {
        setCelebrate(false);
        if (quizIndex + 1 >= quizQuestions.length) {
          setQuizDone(true);
        } else {
          setQuizIndex(i => i + 1);
          setAnswered(null);
        }
      }, 1800);
    } else {
      speak(
        lang === 'en' ? "Try again! You can do it!" :
        lang === 'roman-hindi' ? "Phir koshish karo! Tum kar sakte ho!" :
        "Meeru cheyyagalaru! Meeru cheyyagalaru!",
        lang
      );
      setTimeout(() => setAnswered(null), 1400);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setAnswered(null);
    setQuizDone(false);
    setScore(0);
    setCelebrate(false);
  };

  const currentQ = quizQuestions[quizIndex];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">

      {celebrate && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-5xl md:text-7xl font-black animate-bounce bg-white/80 dark:bg-black/80 px-8 py-6 rounded-3xl shadow-2xl text-center">
            🎊 Masha'Allah! 🎊<br />
            <span className="text-2xl text-primary">
              {lang === 'en' ? 'Correct!' : lang === 'roman-hindi' ? 'Sahi jawab!' : 'Correct jawabu!'}
            </span>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-extrabold text-primary mb-4 drop-shadow-sm flex justify-center items-center gap-4">
          <Star className="text-yellow-400 w-12 h-12 fill-current" />
          {lang === 'en' ? 'Kids Zone' : lang === 'roman-hindi' ? 'Bachon ka Kona' : 'Pillala Vibhaagam'}
          <Moon className="text-yellow-400 w-12 h-12 fill-current" />
        </h1>
        <p className="text-xl font-medium text-muted-foreground">
          {lang === 'en' ? 'Fun learning for little champions! 🌟' :
           lang === 'roman-hindi' ? 'Chote champions ke liye maza aur seekh! 🌟' :
           'Chinna champions kosam samtosha viluvalu! 🌟'}
        </p>
      </div>

      <Tabs defaultValue="pillars" className="w-full">
        <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-2">
          <TabsTrigger value="pillars" className="text-base py-2 px-4 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm">
            {lang === 'en' ? '5 Pillars' : lang === 'roman-hindi' ? '5 Arkan' : '5 Stambhalu'}
          </TabsTrigger>
          <TabsTrigger value="alphabet" className="text-base py-2 px-4 rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground shadow-sm">
            {lang === 'en' ? 'Arabic A-B-C' : lang === 'roman-hindi' ? 'Arabi Huroof' : 'Arabi Aksharaalu'}
          </TabsTrigger>
          <TabsTrigger value="duas" className="text-base py-2 px-4 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm">
            {lang === 'en' ? "Daily Du'as" : lang === 'roman-hindi' ? "Roz ke Du'ay" : "Roju Du'alu"}
          </TabsTrigger>
          <TabsTrigger value="quiz" className="text-base py-2 px-4 rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground shadow-sm">
            {lang === 'en' ? 'Quiz' : lang === 'roman-hindi' ? 'Quiz' : 'Quiz'}
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">

          {/* ── 5 PILLARS ── */}
          <TabsContent value="pillars" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl p-6 border-4 shadow-sm hover:scale-105 transition-transform ${pillar.color}`}
                  data-testid={`pillar-card-${idx}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-4xl">{pillar.emoji}</span>
                    <AudioButton
                      onClick={() => handleSpeak(`${t(pillar.title, lang)}. ${t(pillar.desc, lang)}`)}
                      onStop={stop}
                      isSpeaking={isSpeaking}
                      volume={volume}
                      onVolumeChange={setVolume}
                    />
                  </div>
                  <h3 className="text-2xl font-black mb-2">{t(pillar.title, lang)}</h3>
                  <p className="text-base font-bold opacity-80">{t(pillar.desc, lang)}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── ARABIC ALPHABET ── */}
          <TabsContent value="alphabet">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {alphabet.map((letter, idx) => (
                <div
                  key={idx}
                  className="bg-card rounded-3xl p-6 border-4 border-primary/20 text-center shadow-sm hover:border-primary hover:scale-105 transition-all cursor-pointer"
                  onClick={() => handleSpeak(`Letter ${letter.en}, ${t(letter.word, lang)}`)}
                  data-testid={`alphabet-card-${idx}`}
                >
                  <div className="text-7xl mb-3 text-primary font-serif" dir="rtl">{letter.ar}</div>
                  <div className="text-2xl font-black text-foreground mb-1">{letter.en}</div>
                  <div className="text-muted-foreground font-bold text-sm">{t(letter.word, lang)}</div>
                  <div className="mt-2 text-xs text-primary/60">
                    {lang === 'en' ? 'Tap to hear' : lang === 'roman-hindi' ? 'Sunne ke liye click karein' : 'Vinalante click cheyyandi'}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── DAILY DU'AS ── */}
          <TabsContent value="duas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {duas.map((dua, idx) => {
                const Icon = dua.icon;
                return (
                  <Card key={idx} className={`rounded-3xl border-4 ${dua.color}`} data-testid={`dua-card-${idx}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-black text-primary flex items-center gap-2">
                          <Icon className="w-5 h-5" /> {t(dua.title, lang)}
                        </h3>
                        <AudioButton
                          onClick={() => handleSpeak(`${dua.phonetic}. ${t(dua.meaning, lang)}`)}
                          onStop={stop}
                          isSpeaking={isSpeaking}
                          volume={volume}
                          onVolumeChange={setVolume}
                        />
                      </div>
                      <p className="text-3xl font-serif text-right mb-3 text-primary leading-relaxed" dir="rtl">{dua.arabic}</p>
                      <p className="text-base font-bold mb-3 italic text-foreground/70">{dua.phonetic}</p>
                      <p className="text-muted-foreground font-medium">{t(dua.meaning, lang)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── QUIZ ── */}
          <TabsContent value="quiz">
            <div className="bg-card border-4 border-accent/30 rounded-3xl p-8 max-w-2xl mx-auto text-center">
              {quizDone ? (
                <div className="animate-in fade-in duration-500">
                  <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-4xl font-black mb-2 text-primary">
                    {lang === 'en' ? 'Quiz Complete!' : lang === 'roman-hindi' ? 'Quiz Mukammal!' : 'Quiz Poorthaindi!'}
                  </h3>
                  <p className="text-2xl font-bold text-secondary mb-2">
                    {lang === 'en' ? `Your score: ${score} / ${quizQuestions.length}` :
                     lang === 'roman-hindi' ? `Aapka score: ${score} / ${quizQuestions.length}` :
                     `Meeru score: ${score} / ${quizQuestions.length}`}
                  </p>
                  <p className="text-xl mb-6 text-muted-foreground">
                    {score === quizQuestions.length
                      ? (lang === 'en' ? '🎊 Perfect! Masha Allah! 🎊' : lang === 'roman-hindi' ? '🎊 Kaamil! Masha Allah! 🎊' : '🎊 Sampoornam! Masha Allah! 🎊')
                      : (lang === 'en' ? 'Great effort! Keep learning!' : lang === 'roman-hindi' ? 'Shandar koshish! Seekhte raho!' : 'Chekkaina prayatnam! Niranatarama naduvalandi!')}
                  </p>
                  <button
                    onClick={resetQuiz}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-lg font-bold hover:bg-primary/90 transition-colors"
                    data-testid="quiz-restart-btn"
                  >
                    {lang === 'en' ? 'Try Again' : lang === 'roman-hindi' ? 'Phir Koshish Karo' : 'Meeru Praryatninchandi'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1">
                      {quizQuestions.map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full transition-colors ${i < quizIndex ? 'bg-primary' : i === quizIndex ? 'bg-secondary' : 'bg-muted'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">
                      {quizIndex + 1} / {quizQuestions.length}
                    </span>
                  </div>

                  <Award className="w-14 h-14 text-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-black mb-8 text-foreground leading-snug" data-testid="quiz-question">
                    {t(currentQ.question, lang)}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {currentQ.options.map((opt, i) => {
                      let btnClass = 'border-2 p-5 rounded-2xl text-xl font-bold transition-all ';
                      if (answered === null) {
                        btnClass += 'bg-muted/50 hover:bg-primary/10 border-primary/30 text-foreground hover:border-primary cursor-pointer';
                      } else if (opt.correct) {
                        btnClass += 'bg-green-100 border-green-500 text-green-700 scale-105';
                      } else if (answered === false && !opt.correct) {
                        btnClass += 'bg-red-100 border-red-400 text-red-600';
                      } else {
                        btnClass += 'bg-muted/30 border-muted text-muted-foreground';
                      }
                      return (
                        <button
                          key={i}
                          className={btnClass}
                          onClick={() => handleAnswer(opt.correct)}
                          data-testid={`quiz-option-${i}`}
                          disabled={answered !== null}
                        >
                          <span className="flex items-center justify-center gap-3">
                            {answered !== null && opt.correct && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {answered !== null && !opt.correct && answered === false && <XCircle className="w-5 h-5 text-red-500" />}
                            {t(opt.label, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {answered === false && (
                    <p className="mt-4 text-red-500 font-bold animate-in fade-in duration-300">
                      {lang === 'en' ? 'Oops! Try again!' : lang === 'roman-hindi' ? 'Oops! Phir koshish karo!' : 'Oops! Meeru Praryatninchandi!'}
                    </p>
                  )}
                </>
              )}
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
