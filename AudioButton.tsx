import { useState } from 'react';
import { Volume2, Square, VolumeX, Volume1 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioButtonProps {
  onClick: () => void;
  onStop?: () => void;
  isSpeaking: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  className?: string;
}

export function AudioButton({ onClick, onStop, isSpeaking, volume, onVolumeChange, className = '' }: AudioButtonProps) {
  const [showSlider, setShowSlider] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      onStop?.();
    } else {
      onClick();
    }
  };

  const handleVolumeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSlider(s => !s);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onVolumeChange(Number(e.target.value));
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={`flex items-center gap-1.5 ${className}`} onClick={e => e.stopPropagation()}>
      <Button
        variant="outline"
        size="icon"
        className={`rounded-full relative transition-all w-8 h-8 shrink-0 ${
          isSpeaking ? 'border-primary text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={handlePlayClick}
        data-testid="audio-play-btn"
        aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
      >
        {isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full w-8 h-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
        onClick={handleVolumeToggle}
        data-testid="audio-volume-toggle"
        aria-label="Toggle volume"
      >
        <VolumeIcon className="w-3.5 h-3.5" />
      </Button>

      {showSlider && (
        <div
          className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2 shadow-lg z-10"
          onClick={e => e.stopPropagation()}
        >
          <VolumeX className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleSliderChange}
            data-testid="audio-volume-slider"
            className="w-20 cursor-pointer accent-primary"
            style={{ height: '4px' }}
            aria-label="Volume"
          />
          <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
        </div>
      )}
    </div>
  );
}
