import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from "lucide-react";

interface Slide {
  image: string;
  captionEn: string;
  captionHindi?: string;
  captionTelugu?: string;
  arabicText?: string;
}

interface StorySlideshowProps {
  prophetName: string;
  prophetNameAr: string;
  slides: Slide[];
  onClose: () => void;
}

export function StorySlideshow({ prophetName, prophetNameAr, slides, onClose }: StorySlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lang, setLang] = useState<'en'|'hi'|'te'>('en');
  const [speaking, setSpeaking] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<any>(null);
  const progressRef = useRef<any>(null);

  const getCaption = (slide: Slide) => {
    if (lang === 'hi' && slide.captionHindi) return slide.captionHindi;
    if (lang === 'te' && slide.captionTelugu) return slide.captionTelugu;
    return slide.captionEn;
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    if (lang === 'hi') utterance.lang = 'hi-IN';
    else if (lang === 'te') utterance.lang = 'te-IN';
    else utterance.lang = 'en-US';
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      if (autoPlay && currentSlide < slides.length - 1) {
        setTimeout(() => goNext(), 1000);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide(c => c + 1);
        setProgress(0);
        setAnimating(false);
      }, 300);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide(c => c - 1);
        setProgress(0);
        setAnimating(false);
      }, 300);
    }
  };

  useEffect(() => {
    if (slides[currentSlide]) {
      speak(getCaption(slides[currentSlide]));
    }
    return () => { window.speechSynthesis.cancel(); };
  }, [currentSlide, lang]);

  useEffect(() => {
    if (autoPlay) {
      progressRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            goNext();
            return 0;
          }
          return p + 1;
        });
      }, 50);
    } else {
      clearInterval(progressRef.current);
      setProgress(0);
    }
    return () => clearInterval(progressRef.current);
  }, [autoPlay, currentSlide]);

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-900 to-emerald-800 shrink-0">
        <div>
          <h2 className="text-white font-serif text-base font-bold">{prophetName} (AS)</h2>
          <p className="text-yellow-300 text-xs" dir="rtl">{prophetNameAr}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={lang} onChange={e=>setLang(e.target.value as 'en'|'hi'|'te')}
            className="bg-emerald-700 text-white text-xs rounded-lg px-2 py-1 border border-emerald-500">
            <option value="en">EN</option>
            <option value="hi">हिं</option>
            <option value="te">తె</option>
          </select>
          <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }}
            className="text-white p-1 rounded-full bg-emerald-700">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Progress bars */}
      <div className="flex gap-1 px-3 py-2 bg-black/80 shrink-0">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${
              i < currentSlide ? 'bg-yellow-400 w-full' :
              i === currentSlide ? 'bg-yellow-400' : 'bg-transparent'
            }`}
              style={i === currentSlide ? {width: `${progress}%`} : {}}/>
          </div>
        ))}
      </div>

      {/* Slide Image */}
      <div className={`flex-1 relative overflow-hidden transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={slide.image}
          alt={getCaption(slide)}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/600x800/0d2818/ffd700?text=${encodeURIComponent(prophetName)}`;
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"/>

        {/* Arabic text overlay */}
        {slide.arabicText && (
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-2 mx-4">
              <p className="text-yellow-300 font-serif text-xl text-center" dir="rtl">{slide.arabicText}</p>
            </div>
          </div>
        )}

        {/* Navigation arrows */}
        <button onClick={goPrev} disabled={currentSlide === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full disabled:opacity-20">
          <ChevronLeft size={24} />
        </button>
        <button onClick={goNext} disabled={currentSlide === slides.length - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full disabled:opacity-20">
          <ChevronRight size={24} />
        </button>

        {/* Slide number */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentSlide + 1}/{slides.length}
          </span>
        </div>
      </div>

      {/* Caption */}
      <div className="bg-gradient-to-t from-black to-black/90 p-4 shrink-0">
        <div className="flex items-start gap-2 mb-3">
          <button onClick={() => speaking ? window.speechSynthesis.cancel() : speak(getCaption(slide))}
            className={`mt-0.5 shrink-0 ${speaking ? 'text-yellow-400' : 'text-white/50'}`}>
            {speaking ? <Volume2 size={16}/> : <VolumeX size={16}/>}
          </button>
          <p className="text-white text-sm leading-relaxed">{getCaption(slide)}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button onClick={() => setAutoPlay(!autoPlay)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${autoPlay ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'}`}>
            {autoPlay ? <Pause size={12}/> : <Play size={12}/>}
            {autoPlay ? 'Pause' : 'Auto Play'}
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${i === currentSlide ? 'bg-yellow-400 w-4 h-2' : 'bg-white/40 w-2 h-2'}`}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}