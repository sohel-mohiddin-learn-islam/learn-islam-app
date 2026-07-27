// v3.0 multilingual
import React, { useState } from 'react';
import { prophets } from '../data/prophets';
import { ScrollArea } from '../components/ui/scroll-area';
import { AudioButton } from '../components/AudioButton';
import { GoldenText } from '../components/GoldenText';
import { StorySlideshow } from '../components/StorySlideshow';
import { useSpeech } from '../hooks/useSpeech';

export default function Prophets() {
  const [selectedProphetId, setSelectedProphetId] = useState(prophets[0].id);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [lang, setLang] = useState<'en'|'hi'|'te'>('en');
  const { speak, stop, isSpeaking, volume, setVolume } = useSpeech();
  const selectedProphet = prophets.find(p => p.id === selectedProphetId) || prophets[0];

  const getStory = () => {
    if (lang === 'hi' && selectedProphet.storyRomanHindi) return selectedProphet.storyRomanHindi;
    if (lang === 'te' && selectedProphet.storyRomanTelugu) return selectedProphet.storyRomanTelugu;
    return selectedProphet.storyEn || '';
  };

  const handleAudio = () => { speak(getStory()); };

  const renderHighlightedStory = (text, highlights) => {
    let result = [text];
    highlights.forEach(highlight => {
      const newResult = [];
      result.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(highlight);
          split.forEach((s, i) => {
            newResult.push(s);
            if (i < split.length - 1) newResult.push(React.createElement(GoldenText, {key: highlight+i}, highlight));
          });
        } else { newResult.push(part); }
      });
      result = newResult;
    });
    return result;
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-background relative overflow-hidden">
      {/* Mobile Prophet Selector */}
      <div className="md:hidden w-full border-b border-border bg-card/50 p-3">
        <select value={selectedProphetId} onChange={(e)=>{stop();setSelectedProphetId(e.target.value);}}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 font-serif text-foreground text-base">
          {prophets.map(p=>(<option key={p.id} value={p.id}>{p.nameEn} (AS)</option>))}
        </select>
      </div>

      {/* Sidebar List */}
      <div className="w-64 border-r border-border bg-card/50 hidden md:block">
        <ScrollArea className="h-full py-4">
          <div className="space-y-1 px-3">
            {prophets.map(p => (
              <button key={p.id} onClick={() => { stop(); setSelectedProphetId(p.id); }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-serif ${selectedProphetId === p.id ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}>
                {p.nameEn} (AS)
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-bold font-serif text-primary mb-2">{selectedProphet.nameEn} (AS)</h1>
            <h2 className="text-2xl font-serif text-primary/80" dir="rtl">{selectedProphet.nameAr}</h2>
          </div>

          {/* Language Switcher */}
          <div className="flex justify-center gap-2 mb-6">
            {(['en','hi','te'] as const).map(l => (
              <button key={l} onClick={()=>{setLang(l);stop();}}
                className={`px-4 py-2 rounded-lg font-serif text-sm transition-colors ${lang===l ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-primary/10'}`}>
                {l==='en'?'English':l==='hi'?'हिंदी':'తెలుగు'}
              </button>
            ))}
          </div>

          {/* Watch Story Button */}
          {selectedProphet.slides && selectedProphet.slides.length > 0 && (
            <div className="flex justify-center mb-6">
              <button onClick={() => setShowSlideshow(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-serif text-lg hover:bg-primary/90 transition-colors shadow-md">
                ▶ Watch Story
              </button>
            </div>
          )}

          <div className="bg-card rounded-xl p-8 border border-border shadow-sm mb-8 relative">
            <div className="absolute top-6 right-6">
              <AudioButton onClick={handleAudio} onStop={stop} isSpeaking={isSpeaking} volume={volume} onVolumeChange={setVolume}/>
            </div>
            <p className="text-lg leading-relaxed font-sans text-foreground/90 whitespace-pre-wrap mt-8 md:mt-0">
              {renderHighlightedStory(getStory(), selectedProphet.highlights)}
            </p>
          </div>

          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-6">
            <h3 className="text-xl font-bold font-serif text-secondary mb-3">Key Lesson</h3>
            <p className="text-foreground/80 font-sans italic text-lg leading-relaxed border-l-4 border-secondary pl-4">
              "{selectedProphet.keyLesson}"
            </p>
          </div>
        </div>
      </div>

      {showSlideshow && selectedProphet.slides && selectedProphet.slides.length > 0 && (
        <StorySlideshow prophetName={selectedProphet.nameEn} prophetNameAr={selectedProphet.nameAr} slides={selectedProphet.slides} onClose={() => setShowSlideshow(false)}/>
      )}
    </div>
  );
}