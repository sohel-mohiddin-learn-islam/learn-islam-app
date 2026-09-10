import { useState, useCallback } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);

  const speak = useCallback(async (text: string, lang: 'en' | 'roman-hindi' | 'roman-telugu' = 'en', vol?: number, rt?: number) => {
    let langCode = 'en-US';
    if (lang === 'roman-hindi') langCode = 'hi-IN';
    if (lang === 'roman-telugu') langCode = 'te-IN';

    try {
      await TextToSpeech.stop();
    } catch {}

    setIsSpeaking(true);
    try {
      await TextToSpeech.speak({
        text,
        lang: langCode,
        rate: rt !== undefined ? rt : rate,
        volume: vol !== undefined ? vol : volume,
        pitch: 1.0,
        category: 'ambient',
      });
    } catch {
      // TTS not available or failed — fail silently
    } finally {
      setIsSpeaking(false);
    }
  }, [volume, rate]);

  const stop = useCallback(async () => {
    try {
      await TextToSpeech.stop();
    } catch {}
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, volume, setVolume, rate, setRate };
}
