import { useRef, useState } from 'react';

// Add your curated Islamic content reels here.
// videoUrl should be a direct link to an .mp4 file (hosted anywhere reachable,
// e.g. Firebase Storage, or bundled into the app the same way we bundled
// intro.mp4 earlier). caption is shown at the bottom of each reel.
interface Reel {
  id: string;
  videoUrl: string;
  caption: string;
}

const reels: Reel[] = [
  // Example placeholder — replace with real content:
  // { id: '1', videoUrl: 'https://example.com/reel1.mp4', caption: 'A short reminder about patience.' },
];

function ReelItem({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="relative w-full h-full snap-start shrink-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-contain"
        loop
        muted
        playsInline
        autoPlay
        onClick={toggleMute}
      />
      <div className="absolute bottom-6 left-4 right-16 text-white font-sans">
        <p className="text-sm leading-relaxed drop-shadow-lg">{reel.caption}</p>
      </div>
      <button
        onClick={toggleMute}
        className="absolute bottom-6 right-4 bg-black/40 rounded-full p-3 text-white"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}

export default function Reels() {
  if (reels.length === 0) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center p-6">
        <p className="text-center text-foreground/70 font-sans">
          No reels available yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory">
      {reels.map((reel) => (
        <ReelItem key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
