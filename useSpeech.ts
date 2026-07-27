import { useState, useEffect, useCallback } from 'react';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, lang: 'en' | 'roman-hindi' | 'roman-telugu' = 'en', vol?: number, rt?: number) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    switch (lang) {
      case 'roman-hindi':
        utterance.lang = 'hi-IN';
        break;
      case 'roman-telugu':
        utterance.lang = 'te-IN';
        break;
      default:
        utterance.lang = 'en-US';
    }

    utterance.volume = vol !== undefined ? vol : volume;
    utterance.rate = rt !== undefined ? rt : rate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [volume, rate]);

  const stop = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, volume, setVolume, rate, setRate };
}
