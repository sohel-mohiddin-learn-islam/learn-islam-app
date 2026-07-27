import { useState } from "react";

export default function Karbala() {
  const [lang, setLang] = useState('en');
  const [showVideo, setShowVideo] = useState(false);

  const stories = {
    en: `Imam Husain (RA), the grandson of Prophet Muhammad (PBUH), stood against the tyranny of Yazid who had declared himself ruler and was forcing people to pledge allegiance to him.

Imam Husain refused to give allegiance to Yazid because doing so would mean accepting oppression as the way of Islam. He said: "I did not rise to make mischief, but to reform the Ummah of my grandfather."

He traveled with his family and only 72 companions. On the plains of Karbala, they were surrounded by an army of thousands. Water was cut off for 3 days.

One by one his companions and family members were martyred. His 6-month-old son Ali Asghar was also martyred. Finally, Imam Husain himself was martyred while in prostration.

Karbala teaches us: stand for truth even when you stand alone. Never bow to oppression.`,
    hi: `Imam Husain (RA), Hazrat Muhammad (PBUH) ke nawase, unhone Yazid ki zulm ke khilaf awaz uthayi jo khud ko hakim ghoshit kar chuka tha.

Imam Husain ne Yazid ki bait se inkar kar diya. Unhone kaha: "Main fasaad failane nahi aaya, apne nana ki ummat ki islah karne aaya hoon."

Woh sirf 72 saathiyon ke saath Karbala ke maidan pahunche. Hazaron ki fauj ne gher liya. 3 din paani band kar diya gaya.

Ek ek karke saathi aur khandaan ke log shaheed hote gaye. 6 maheene ke bete Ali Asghar bhi shaheed hue. Akhir mein Imam Husain sajde mein shaheed hue.

Karbala sikhata hai: sach ke liye khado chahe akele ho. Zulm ke aage mat jhuko.`,
    te: `Imam Husain (RA), Hazrat Muhammad (PBUH) manawarudu, Yazid zulmuku virodhingaa nilabadaadu.

Imam Husain Yazid bait ni tiras karichaadu. Aayana annaadu: "Naanu chedu cheyyataniki raaledu, naa taata Ummah ni samskarinchaataniki vacchaanu."

Aayana kevalam 72 sahaayakurulatho Karbala lo vacchaadu. Velavelu sainikulum chuttumuttaaru. 3 roju paatu neellu nirakoLLaaru.

Okka okkarugaa sahaayakurulu mariyu kutumba sadasyulu shaheed ayinaaru. 6 naelala kumaarudu Ali Asghar kuda shaheed ayinaadu. Chivara ki Imam Husain sajda lo shaheed ayinaadu.

Karbala nerpistaundi: okkaRRuggaa nilabadinaa nijaaniki nilabaDanDi. Zulm mundu vongabakaanDi.`
  };

  const lessons = {
    en: "Karbala teaches us that truth must be spoken even if you stand alone. Imam Husain chose death with dignity over life with oppression.",
    hi: "Karbala sikhata hai ke sach bolna zaroori hai chahe tum akele khade ho. Imam Husain ne zillat ki zindagi se izzat ki maut ko tarjeeh di.",
    te: "Karbala manammi nerpistaundi ke nijamu cheppaTam avasaramu meeru okkaRRuggaa nilabaDinaa. Imam Husain zillat tho jeevitam kaanna gauravamu tho maraNamee ishtapadaadu."
  };

  const titles = {
    en: "The Story of Karbala",
    hi: "Karbala Ki Kahani",
    te: "Karbala Katha"
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-serif text-primary mb-2">{titles[lang]}</h1>
          <div className="text-2xl mt-2 text-primary/80" dir="rtl">كربلاء</div>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {['en','hi','te'].map(l => (
            <button key={l} onClick={()=>setLang(l)}
              className={`px-4 py-2 rounded-lg font-serif text-sm transition-colors ${lang===l ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-primary/10'}`}>
              {l==='en'?'English':l==='hi'?'हिंदी':'తెలుగు'}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-6">
          <button onClick={()=>setShowVideo(!showVideo)}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-serif text-lg hover:bg-red-700 transition-colors shadow-md">
            {showVideo ? '✕ Hide Video' : '▶ Watch Documentary'}
          </button>
        </div>

        {showVideo && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <div className="relative w-full" style={{paddingBottom:'56.25%'}}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/ai4eL1rNym0"
                title="Karbala Documentary"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <h3 className="text-xl font-bold font-serif text-primary mb-4">
            {lang==='en'?'The Full Story':lang==='hi'?'Puri Kahani':'Puri Katha'}
          </h3>
          <p className="text-lg leading-relaxed font-sans text-foreground/90 whitespace-pre-wrap">{stories[lang]}</p>
        </div>

        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-6">
          <h3 className="text-xl font-bold font-serif text-secondary mb-3">Key Lesson</h3>
          <p className="text-foreground/80 font-sans italic text-lg leading-relaxed border-l-4 border-secondary pl-4">
            "{lessons[lang]}"
          </p>
        </div>
      </div>
    </div>
  );
}