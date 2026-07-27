import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoldenText } from '@/components/GoldenText';
import { AudioButton } from '@/components/AudioButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeech } from '@/hooks/useSpeech';
import { Droplets, Activity } from 'lucide-react';

type LangKey = 'en' | 'roman-hindi' | 'roman-telugu';
interface Tri { en: string; 'roman-hindi': string; 'roman-telugu': string; }
const t = (obj: Tri, lang: LangKey) => obj[lang];

interface WuduStep {
  step: number;
  title: Tri;
  desc: Tri;
  note: Tri;
  highlight: boolean;
}

const wuduSteps: WuduStep[] = [
  {
    step: 1,
    title: { en: 'Niyyah (Intention)', 'roman-hindi': 'Niyyah (Iraada)', 'roman-telugu': 'Niyyat (Sankalpam)' },
    desc: {
      en: 'Make the intention in your heart to perform Wudu for the sake of Allah.',
      'roman-hindi': 'Apne dil mein Allah ki raza ke liye wudu karne ki niyyah karein.',
      'roman-telugu': 'Allah kosam wudu cheyyālanī manasulo sankalpam chesukōnḍi.',
    },
    note: {
      en: 'Niyyah is made in the heart — it does not need to be spoken aloud.',
      'roman-hindi': 'Niyyah dil se hoti hai — ise zabar se kehna zaruri nahi.',
      'roman-telugu': 'Niyyat hrudayamlō cēstāru — voice tō cheppāṭam avasaram kādu.',
    },
    highlight: true,
  },
  {
    step: 2,
    title: { en: 'Bismillah', 'roman-hindi': 'Bismillah', 'roman-telugu': 'Bismillah' },
    desc: {
      en: 'Say: "Bismillah hir-Rahman nir-Raheem" — In the name of Allah, the Most Gracious, the Most Merciful.',
      'roman-hindi': '"Bismillah hir-Rahman nir-Raheem" kahein — Allah ke naam se jo bahut meharbaan, bahut rehm waala hai.',
      'roman-telugu': '"Bismillah hir-Rahman nir-Raheem" cheppanḍi — Chāla dayaaluḍu, Chāla karuṇāmayuḍu Ayina Allah paerutō.',
    },
    note: {
      en: 'Always begin with Bismillah — it is a Sunnah of the Prophet (SAW).',
      'roman-hindi': 'Hamesha Bismillah se shuru karein — yeh Nabi (SAW) ki Sunnah hai.',
      'roman-telugu': 'Enppuḍū Bismillāhtō prārambhinchandi — idi Nabi (SAW) yokka Sunnah.',
    },
    highlight: true,
  },
  {
    step: 3,
    title: { en: 'Wash Hands', 'roman-hindi': 'Haath Dhona', 'roman-telugu': 'Chetulu Koganḍi' },
    desc: {
      en: 'Wash both hands up to the wrists 3 times, starting with the right hand.',
      'roman-hindi': 'Dono haathon ko pakauon tak 3 baar dhoyein, pehle seedha haath.',
      'roman-telugu': 'Rendu chetulunu kaṭṭu varaku 3 sarlu kōgānḍi, muṇḍu kudi cheyyi.',
    },
    note: {
      en: 'Always start with the right side — this is the Sunnah.',
      'roman-hindi': 'Hamesha seedhi taraf se shuru karein — yeh Sunnah hai.',
      'roman-telugu': 'Enppuḍū kudi vaipu tō prārambhinchandi — idi Sunnah.',
    },
    highlight: false,
  },
  {
    step: 4,
    title: { en: 'Rinse Mouth', 'roman-hindi': 'Muh Dhona', 'roman-telugu': 'Nōru Pallāḍinchandi' },
    desc: {
      en: 'Take water in the right hand and rinse the mouth thoroughly 3 times.',
      'roman-hindi': 'Seedhe haath mein pani lekar muh ko 3 baar ache se khugli karein.',
      'roman-telugu': 'Kudi cheyyi tō nīru teesukōni nōrunu 3 sarlu bāgā pallaḍinchanḍi.',
    },
    note: {
      en: 'Rinse thoroughly — water should reach all parts of the mouth.',
      'roman-hindi': 'Ache se khugli karein — pani muh ke har hisse tak pahunche.',
      'roman-telugu': 'Bāgā pallaḍinchanḍi — nīru nōru anni bhaagaalaaku cērukondi.',
    },
    highlight: false,
  },
  {
    step: 5,
    title: { en: 'Clean Nose', 'roman-hindi': 'Naak Saaf Karna', 'roman-telugu': 'Mukkunu శుభ్రం Cheyyaṭamu' },
    desc: {
      en: 'Sniff water into the nose with the right hand and blow it out with the left, 3 times.',
      'roman-hindi': 'Seedhe haath se naak mein paani lein aur ulte haath se 3 baar bahar nikaalein.',
      'roman-telugu': 'Kudi cheyyi tō mukkuku nīru ādhinchānḍi mariyu edama cheyyi tō 3 sarlu bairu pooyānḍi.',
    },
    note: {
      en: 'Sniffing water up the nose is Sunnah; blowing it out removes impurities.',
      'roman-hindi': 'Naak mein pani chadana Sunnah hai; ise bahar nikalna napaaki door karta hai.',
      'roman-telugu': 'Mukkuku nīru ādhinchāṭam Sunnah; daanini bairu poottaṭam maailanu taḷḷipōstundi.',
    },
    highlight: false,
  },
  {
    step: 6,
    title: { en: 'Wash Face', 'roman-hindi': 'Chehra Dhona', 'roman-telugu': 'Mukhaamu Koganḍi' },
    desc: {
      en: 'Wash the entire face 3 times — from the hairline to the chin, and from ear to ear.',
      'roman-hindi': 'Poora chehra 3 baar dhoyein — pesh se thodi tak, aur ek kaan se dusre kaan tak.',
      'roman-telugu': 'Mukhamunu 3 sarlu koganḍi — nūdi nunchi gaddamu varaku, oka chevi nunchi renḍava chevi varaku.',
    },
    note: {
      en: 'The face must be washed completely — this is a Fard (obligatory) act of Wudu.',
      'roman-hindi': 'Chehra poori tarah dhona zaroori hai — yeh Wudu ka farz hai.',
      'roman-telugu': 'Mukhaamu pūrtigā koganḍi — idi Wudu lō Fard (anivāryamu).',
    },
    highlight: true,
  },
  {
    step: 7,
    title: { en: 'Wash Arms', 'roman-hindi': 'Baazoo Dhona', 'roman-telugu': 'Chetulu Koganḍi' },
    desc: {
      en: 'Wash the right arm up to and including the elbow 3 times, then the left arm 3 times.',
      'roman-hindi': 'Pehle seedha baazoo kohni samet 3 baar dhoyein, phir ulta baazoo 3 baar dhoyein.',
      'roman-telugu': 'Muṇḍu kudi cheyyi mōcunnchi saha 3 sarlu koganḍi, tharuvāta edama cheyyi 3 sarlu koganḍi.',
    },
    note: {
      en: 'Include the elbows — washing only below the elbow is not valid.',
      'roman-hindi': 'Kohniyon ko bhi shamil karein — sirf kohni ke neeche dhona durust nahi.',
      'roman-telugu': 'Mōcukkūḍā koganḍi — mōcu daggina daatinchakuṇḍā dhōvanamu saridaa kādu.',
    },
    highlight: false,
  },
  {
    step: 8,
    title: { en: 'Masah (Wipe Head)', 'roman-hindi': 'Masah (Sar Par Pherna)', 'roman-telugu': 'Masah (Talanu Taakanḍi)' },
    desc: {
      en: 'Wipe the entire head with wet hands — from the front hairline to the back of the head — once.',
      'roman-hindi': 'Geele haathon se poore sar ka masah karein — pesh se sar ke piche tak — sirf ek baar.',
      'roman-telugu': 'Tḍi chetulatō talanu muṇḍu nunchi venakala varaku oka sāri taakanḍi.',
    },
    note: {
      en: 'Masah of the head is done only ONCE — unlike washing which is 3 times.',
      'roman-hindi': 'Sar ka masah sirf EK baar kiya jata hai — dhone ki tarah 3 baar nahi.',
      'roman-telugu': 'Tala Masah OKA sārī mātramu cēstāru — dhōvataṭam lāgā 3 sarlu kādu.',
    },
    highlight: true,
  },
  {
    step: 9,
    title: { en: 'Clean Ears', 'roman-hindi': 'Kaanon ka Masah', 'roman-telugu': 'Cheviḷḷu Taakāṭamu' },
    desc: {
      en: 'Insert the index fingers into the ears and wipe the back of the ears with the thumbs.',
      'roman-hindi': 'Shahaadat ungli kaanon mein daalo aur anguthe se kaanon ki pith ka masah karo.',
      'roman-telugu': 'Chechuvu vēḷḷanu cevilōniki pettanḍi mariyu bōṭu vēḷḷatō cheviḷḷa venakabhāgamu taakānḍi.',
    },
    note: {
      en: 'Use the same water from the Masah of the head — do not take fresh water.',
      'roman-hindi': 'Sar ke masah waale pani se hi karein — naya pani na lein.',
      'roman-telugu': 'Tala Masah water e vāḍanḍi — kotha nīru tīsukondi kādu.',
    },
    highlight: false,
  },
  {
    step: 10,
    title: { en: 'Wash Feet', 'roman-hindi': 'Paaon Dhona', 'roman-telugu': 'Pādālanu Koganḍi' },
    desc: {
      en: 'Wash the right foot up to and including the ankle 3 times, then the left foot 3 times.',
      'roman-hindi': 'Pehle seedha paaon tokne samet 3 baar dhoyein, phir ulta paaon 3 baar dhoyein.',
      'roman-telugu': 'Muṇḍu kudi pāda maṭṭemu tō saha 3 sarlu koganḍi, tharuvāta edama pādam 3 sarlu koganḍi.',
    },
    note: {
      en: 'Include the ankles completely — the toes and the space between them must be washed.',
      'roman-hindi': 'Tokne poori tarah shamil karein — unglion ke darmian bhi dhoyein.',
      'roman-telugu': 'Maṭṭemunu pūrtigā koganḍi — vēḷḷa madhya bhaagamu koḍi thakaṭamu marachipōndi kādu.',
    },
    highlight: true,
  },
];

interface NamazStep {
  title: Tri;
  arabic: string;
  desc: Tri;
  highlight: boolean;
}

const namazSteps: NamazStep[] = [
  {
    title: { en: 'Niyyah', 'roman-hindi': 'Niyyah', 'roman-telugu': 'Niyyat' },
    arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ',
    desc: {
      en: 'Make the intention in your heart for the specific prayer (e.g. "I intend to offer 4 rakats of Zuhr Fard").',
      'roman-hindi': 'Dil mein us khaas namaz ki niyyah karein (jaise: "Main Zuhr ki 4 farz rakaat padhne ki niyyah karta hoon").',
      'roman-telugu': 'Aa praarthana kosam manasulo sankalpamu chesukōnḍi (e.g. "Nenu Zuhr Fard 4 rakaat chaduvutānu").',
    },
    highlight: true,
  },
  {
    title: { en: 'Takbeer-e-Tahrima', 'roman-hindi': 'Takbeer-e-Tahrima', 'roman-telugu': 'Takbeer-e-Tahrima' },
    arabic: 'اللَّهُ أَكْبَرُ',
    desc: {
      en: 'Raise both hands to the earlobes and say "Allahu Akbar" — Allah is the Greatest. This opens the prayer.',
      'roman-hindi': 'Dono haath kanon ki lolon tak uthayein aur "Allahu Akbar" kahein — Allah sabse bada hai. Yeh namaz ka aaghaz hai.',
      'roman-telugu': 'Rendu chetulunu cheviḷḷa varaku etchanḍi mariyu "Allahu Akbar" cheppanḍi — Allah meeru Mahānuḍu. Idi praarthana prārambhiṁchindi.',
    },
    highlight: true,
  },
  {
    title: { en: 'Qiyam — Standing', 'roman-hindi': 'Qiyam — Khada Hona', 'roman-telugu': 'Qiyam — Nilabadanḍi' },
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    desc: {
      en: 'Standing upright: Recite Thana (Subhanakal-lahumma), then Surah Al-Fatiha, then any short Surah from the Quran.',
      'roman-hindi': 'Seedha khade hokar: Thana (Subhanakal-lahumma), phir Surah Fatiha, phir koi chhoti Surah padein.',
      'roman-telugu': 'Nilabadi: Thana (Subhanakal-lahumma), tharuvāta Surah Al-Fatiha, tharuvāta Quran nunchi oka chhotti Surah chaduvanḍi.',
    },
    highlight: false,
  },
  {
    title: { en: 'Ruku — Bowing', 'roman-hindi': 'Ruku — Jhukna', 'roman-telugu': 'Ruku — Ventuku Vanganḍi' },
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    desc: {
      en: 'Bow forward with a flat back, hands on knees. Say "Subhana Rabbiyal Azeem" (Glory be to my Lord, the Most Great) at least 3 times.',
      'roman-hindi': 'Seedhi kamar ke saath jhukein, haath ghutno par. "Subhana Rabbiyal Azeem" (Mera Rab azeem hai) 3 baar kahein.',
      'roman-telugu': 'Cheta muddu tō mundu vanganḍi, chetulu mōṭi paiku. "Subhana Rabbiyal Azeem" (Nā Prabhuvu Mahānuḍu) kamīḍa 3 sarlu cheppanḍi.',
    },
    highlight: true,
  },
  {
    title: { en: 'Qawmah — Rising from Ruku', 'roman-hindi': 'Qawmah — Ruku se Uthna', 'roman-telugu': 'Qawmah — Rukū nundi Lēvanḍi' },
    arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ',
    desc: {
      en: 'Rise back to standing and say: "Sami Allahu liman hamidah" — Allah hears all who praise Him. Then say "Rabbana lakal hamd".',
      'roman-hindi': 'Dobara khade hokar kahein: "Sami Allahu liman hamidah" — Allah uski sunta hai jo uski hamd kare. Phir "Rabbana lakal hamd" kahein.',
      'roman-telugu': 'Meeru nilabaḍi cheppanḍi: "Sami Allahu liman hamidah" — Allah ayana ṣaṭṭanu vandinchē varini vistāru. Tharuvāta "Rabbana lakal hamd" cheppanḍi.',
    },
    highlight: false,
  },
  {
    title: { en: 'Sujood — Prostration', 'roman-hindi': 'Sujood — Sajda', 'roman-telugu': 'Sujood — Namaskaaram' },
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    desc: {
      en: 'Go to the ground: forehead, nose, both hands, knees and toes touching the floor. Say "Subhana Rabbiyal A\'la" (Glory to my Lord, the Most High) at least 3 times.',
      'roman-hindi': 'Zameen par jayein: maatha, naak, dono haath, ghutnein aur unglion ki pathiya zameen se lagein. "Subhana Rabbiyal A\'la" 3 baar kahein.',
      'roman-telugu': 'Muttiku vellānḍi: nūdi, mukkū, rendu chetulū, mōṭikāḷḷū mariyu vēḷḷa arthyālu ṭatukovaṭamu anivāryam. "Subhana Rabbiyal A\'la" 3 sarlu cheppanḍi.',
    },
    highlight: true,
  },
  {
    title: { en: 'Jalsa — Sitting between Sujoods', 'roman-hindi': 'Jalsa — Dono Sajdon ke Beech Baithna', 'roman-telugu': 'Jalsa — Rendu Sujoodula Madhyalō Kanḍi' },
    arabic: 'رَبِّ اغْفِرْ لِي',
    desc: {
      en: 'Sit briefly between the two prostrations. Say: "Rabbi-ghfir li" — O my Lord, forgive me.',
      'roman-hindi': 'Dono sajdon ke darmian thodi der baithein. "Rabbi-ghfir li" kahein — Ai mere Rabb, mujhe maaf kardo.',
      'roman-telugu': 'Rendu Sujoodula madhyalō kāṣṭam kanḍi. "Rabbi-ghfir li" cheppanḍi — Ō nā Prabhuvu, nannu kshaminchandi.',
    },
    highlight: false,
  },
  {
    title: { en: 'Tashahhud — Final Sitting', 'roman-hindi': 'Tashahhud — Aakhri Baithak', 'roman-telugu': 'Tashahhud — Chethi Kanḍi' },
    arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ',
    desc: {
      en: 'In the final sitting, recite At-Tahiyyat in full, then send blessings upon the Prophet (Durood Ibrahim), then make Du\'a.',
      'roman-hindi': 'Aakhri baithak mein: At-Tahiyyat puri padein, phir Durood Ibrahim, phir du\'a maangein.',
      'roman-telugu': 'Chethi kanḍilō: At-Tahiyyat pūrtigā chaduvanḍi, tharuvāta Durood Ibrahim, tharuvāta Du\'a cheyyānḍi.',
    },
    highlight: true,
  },
  {
    title: { en: 'Salaam — Closing the Prayer', 'roman-hindi': 'Salaam — Namaz Khatam Karna', 'roman-telugu': 'Salaam — Praarthana Mudinchanḍi' },
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
    desc: {
      en: 'Turn your face to the right and say "Assalamu Alaykum wa Rahmatullah", then turn left and repeat — this closes the prayer.',
      'roman-hindi': 'Pehle daaye munh phero aur "Assalamu Alaykum wa Rahmatullah" kaho, phir baaye phero aur dobara kaho — isse namaz khatam hoti hai.',
      'roman-telugu': 'Muṇḍu kudi vaipu tirugānḍi mariyu "Assalamu Alaykum wa Rahmatullah" cheppanḍi, tharuvāta edama vaipu tirugānḍi mariyu meeru mōḍupōtundi.',
    },
    highlight: true,
  },
];

const prayers = [
  { name: { en: 'Fajr', 'roman-hindi': 'Fajr', 'roman-telugu': 'Fajr' }, rakats: { en: '2 Fard', 'roman-hindi': '2 Farz', 'roman-telugu': '2 Fard' }, time: { en: 'Dawn', 'roman-hindi': 'Fajr', 'roman-telugu': 'Usha kaalam' } },
  { name: { en: 'Zuhr', 'roman-hindi': 'Zuhr', 'roman-telugu': 'Zuhr' }, rakats: { en: '4 Fard', 'roman-hindi': '4 Farz', 'roman-telugu': '4 Fard' }, time: { en: 'Noon', 'roman-hindi': 'Dopahar', 'roman-telugu': 'Madhyāhnam' } },
  { name: { en: 'Asr', 'roman-hindi': 'Asr', 'roman-telugu': 'Asr' }, rakats: { en: '4 Fard', 'roman-hindi': '4 Farz', 'roman-telugu': '4 Fard' }, time: { en: 'Afternoon', 'roman-hindi': 'Dopahar Baad', 'roman-telugu': 'Aparaahnam' } },
  { name: { en: 'Maghrib', 'roman-hindi': 'Maghrib', 'roman-telugu': 'Maghrib' }, rakats: { en: '3 Fard', 'roman-hindi': '3 Farz', 'roman-telugu': '3 Fard' }, time: { en: 'Sunset', 'roman-hindi': 'Sunset', 'roman-telugu': 'Soorya astamayam' } },
  { name: { en: 'Isha', 'roman-hindi': 'Isha', 'roman-telugu': 'Isha' }, rakats: { en: '4 Fard', 'roman-hindi': '4 Farz', 'roman-telugu': '4 Fard' }, time: { en: 'Night', 'roman-hindi': 'Raat', 'roman-telugu': 'Rātri' } },
];

export default function PrayerGuide() {
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();
  const lang = language as LangKey;
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  const toggleStep = (step: number) => {
    setCheckedSteps(prev =>
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

  const speakStep = (step: WuduStep) => {
    if (isSpeaking) { stop(); return; }
    speak(`${t(step.title, lang)}. ${t(step.desc, lang)}. ${t(step.note, lang)}`, lang);
  };

  const speakNamazStep = (step: NamazStep) => {
    if (isSpeaking) { stop(); return; }
    speak(`${t(step.title, lang)}. ${t(step.desc, lang)}`, lang);
  };

  const speakAll = (content: string) => {
    if (isSpeaking) { stop(); return; }
    speak(content, lang);
  };

  const wuduFullText = wuduSteps.map(s => `Step ${s.step}: ${t(s.title, lang)}. ${t(s.desc, lang)}`).join('. ');
  const namazFullText = namazSteps.map(s => `${t(s.title, lang)}: ${t(s.desc, lang)}`).join('. ');

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-3">
          {lang === 'en' ? 'Prayer Guide' : lang === 'roman-hindi' ? 'Namaz Guide' : 'Namaz Margadarshini'}
        </h1>
        <p className="text-xl text-muted-foreground font-sans">
          {lang === 'en' ? 'Step by step guide to purification and prayer' :
           lang === 'roman-hindi' ? 'Wudu aur Namaz ki qadam-ba-qadam rahnumai' :
           'Wudu mariyu Namaz kosam adugu adugu margadarshakam'}
        </p>
      </div>

      <Tabs defaultValue="wudu" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10">
          <TabsTrigger value="wudu" className="text-lg py-3 flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            {lang === 'en' ? 'Wudu' : lang === 'roman-hindi' ? 'Wudu' : 'Wudu'}
          </TabsTrigger>
          <TabsTrigger value="namaz" className="text-lg py-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {lang === 'en' ? 'Namaz' : lang === 'roman-hindi' ? 'Namaz' : 'Namaz'}
          </TabsTrigger>
        </TabsList>

        {/* ── WUDU TAB ── */}
        <TabsContent value="wudu" className="space-y-4">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold font-serif text-primary">
                {lang === 'en' ? 'Steps of Wudu (Ablution)' :
                 lang === 'roman-hindi' ? 'Wudu ke Qadam' :
                 'Wudu Adugulu'}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCheckedSteps([])}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                  data-testid="wudu-reset-btn"
                >
                  {lang === 'en' ? 'Reset' : lang === 'roman-hindi' ? 'Reset' : 'Reset'}
                </button>
                <AudioButton
                  onClick={() => speakAll(wuduFullText)}
                  onStop={stop}
                  isSpeaking={isSpeaking}
                  volume={volume}
                  onVolumeChange={setVolume}
                />
              </div>
            </div>

            <div className="space-y-5">
              {wuduSteps.map((s) => {
                const checked = checkedSteps.includes(s.step);
                return (
                  <div
                    key={s.step}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-all ${checked ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/30'}`}
                    data-testid={`wudu-step-${s.step}`}
                  >
                    <button
                      onClick={() => toggleStep(s.step)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-serif shrink-0 border-2 transition-all ${
                        checked
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-primary/10 text-primary border-primary/30'
                      }`}
                    >
                      {checked ? '✓' : s.step}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-base mb-1">{t(s.title, lang)}</h3>
                        <AudioButton
                          onClick={() => speakStep(s)}
                          onStop={stop}
                          isSpeaking={isSpeaking}
                          volume={volume}
                          onVolumeChange={setVolume}
                          className="shrink-0"
                        />
                      </div>
                      <p className={`text-base text-foreground/90 mb-2 ${checked ? 'line-through text-muted-foreground' : ''}`}>
                        {t(s.desc, lang)}
                      </p>
                      {s.highlight && (
                        <p className="text-sm">
                          <GoldenText>{t(s.note, lang)}</GoldenText>
                        </p>
                      )}
                      {!s.highlight && (
                        <p className="text-sm text-muted-foreground italic">{t(s.note, lang)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{checkedSteps.length} / {wuduSteps.length}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(checkedSteps.length / wuduSteps.length) * 100}%` }}
                  />
                </div>
                <span>
                  {lang === 'en' ? 'complete' : lang === 'roman-hindi' ? 'mukammal' : 'poorthi'}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── NAMAZ TAB ── */}
        <TabsContent value="namaz">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {prayers.map(p => (
              <div key={p.name.en} className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
                <div className="font-bold text-lg text-primary">{t(p.name, lang)}</div>
                <div className="text-sm font-medium text-secondary mt-1">{t(p.rakats, lang)}</div>
                <div className="text-xs text-muted-foreground mt-2">{t(p.time, lang)}</div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-8 border-b pb-4">
              <h2 className="text-2xl font-bold font-serif text-primary">
                {lang === 'en' ? 'Steps of a Rakat' :
                 lang === 'roman-hindi' ? 'Ek Rakat ke Qadam' :
                 'Oka Rakat Adugulu'}
              </h2>
              <AudioButton
                onClick={() => speakAll(namazFullText)}
                onStop={stop}
                isSpeaking={isSpeaking}
                volume={volume}
                onVolumeChange={setVolume}
              />
            </div>

            <div className="space-y-8">
              {namazSteps.map((step, idx) => (
                <div key={idx} className="border-l-4 border-primary/30 pl-6 relative" data-testid={`namaz-step-${idx}`}>
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[8px] top-2 ring-4 ring-card"></div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold font-serif text-foreground mb-2">{t(step.title, lang)}</h3>
                      <p className="text-2xl font-serif text-primary my-2" dir="rtl">{step.arabic}</p>
                      {step.highlight ? (
                        <GoldenText>{t(step.desc, lang)}</GoldenText>
                      ) : (
                        <p className="text-muted-foreground text-base leading-relaxed">{t(step.desc, lang)}</p>
                      )}
                    </div>
                    <AudioButton
                      onClick={() => speakNamazStep(step)}
                      onStop={stop}
                      isSpeaking={isSpeaking}
                      volume={volume}
                      onVolumeChange={setVolume}
                      className="shrink-0 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
