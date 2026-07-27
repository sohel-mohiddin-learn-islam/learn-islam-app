import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeech } from '@/hooks/useSpeech';
import { AudioButton } from '@/components/AudioButton';
import { GoldenText } from '@/components/GoldenText';
import { IslamicDivider } from '@/components/IslamicDivider';

export default function QuranValues() {
  const { language } = useLanguage();
  const { speak, isSpeaking, stop, volume, setVolume } = useSpeech();

  const sections = [
    {
      titleEn: "What is the Quran?",
      titleHi: "Quran kya hai?",
      titleTe: "Quran ante emiti?",
      textEn: "The Quran is the literal, uncreated word of Allah, revealed as a complete guide for all of humanity. It is the final testament, bringing light, wisdom, and profound spiritual healing.",
      textHi: "Quran Allah ka kalaam hai, jo poori insaniyat ke liye ek hidayat hai.",
      textTe: "Quran anedi Allah yokka sandesham, idi manavalamdariki oka margadarshakam.",
      highlight: "literal, uncreated word of Allah"
    },
    {
      titleEn: "The Revelation (Wahy)",
      titleHi: "Wahi",
      titleTe: "Wahi (Sandesham)",
      textEn: "It was revealed to Prophet Muhammad (SAW) through the Angel Jibreel (Gabriel) over a period of 23 years. The revelation began in the Cave of Hira during the month of Ramadan, with the command: 'Read! In the name of your Lord who created.'",
      textHi: "Yeh 23 saal ke arse mein Jibreel (AS) ke zariye Nazil hui.",
      textTe: "Idi 23 samvatsarala patu Angel Jibreel dwara Prophet Muhammad (SAW) ku andinchabidindi.",
      highlight: "Read! In the name of your Lord who created"
    },
    {
      titleEn: "Miraculous Nature & Preservation",
      titleHi: "Mojiza aur Hifazat",
      titleTe: "Adbhutham mariyu Parirakshana",
      textEn: "The Quran possesses an inimitable Arabic eloquence (I'jaz). Unlike previous scriptures, Allah Himself promised to protect it. For over 1400 years, not a single letter has been changed. Millions of Huffaz (memorizers) carry it in their hearts today.",
      textHi: "Allah ne khud iski hifazat ka wada kiya hai aur 1400 saal se iska ek harf bhi nahi badla.",
      textTe: "Allah swayamga deenini rakshistanani maata icharu. 1400 samvatsaraluga okka aksharam kuda maaraledu.",
      highlight: "Allah Himself promised to protect it"
    }
  ];

  const getText = (section: any) => {
    return language === 'en' ? section.textEn 
      : language === 'roman-hindi' ? section.textHi 
      : section.textTe;
  };

  const getTitle = (section: any) => {
    return language === 'en' ? section.titleEn 
      : language === 'roman-hindi' ? section.titleHi 
      : section.titleTe;
  };

  const handleAudio = () => {
    if (isSpeaking) {
      stop();
    } else {
      const fullText = sections.map(s => `${getTitle(s)}. ${getText(s)}`).join(". ");
      speak(fullText, language);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12 relative">
        <div className="absolute right-0 top-0">
          <AudioButton onClick={handleAudio} onStop={stop} isSpeaking={isSpeaking} volume={volume} onVolumeChange={setVolume} />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-serif text-primary mb-4">Values of the Quran</h1>
        <p className="text-2xl font-serif text-primary/70" dir="rtl">فضائل القرآن</p>
      </div>

      <IslamicDivider />

      <div className="space-y-12 mt-12">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold font-serif text-primary mb-4">{getTitle(section)}</h2>
            <p className="text-lg font-sans text-foreground/90 leading-relaxed">
              {language === 'en' ? (
                <>
                  {getText(section).split(section.highlight).map((part: string, i: number, arr: string[]) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && <GoldenText>{section.highlight}</GoldenText>}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                getText(section)
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
