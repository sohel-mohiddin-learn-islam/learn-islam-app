import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";

import { getPosts } from "@/lib/posts";

const REELS_BASE_URL = "./";
  "https://sohel-mohiddin-learn-islam.github.io/learn-islam-app/";

const reelFiles: string[] = [
  "VID_20260905_125534_061.mp4",
  "VID_20260905_125932_824.mp4",
  "VID_20260905_125954_462.mp4",
  "VID_20260905_125839_972.mp4",
  "VID_20260905_125817_770.mp4",
  "VID_20260905_125831_798.mp4",
  "VID_20260905_125901_742.mp4",
  "VID_20260905_125810_534.mp4",
  "VID_20260905_125828_659.mp4",
  "VID_20260905_125753_012.mp4",
];

type Reel = {
  id: string;
  src: string;
  caption?: string;
  userName?: string;
};

const localReels: Reel[] = reelFiles.map((file, i) => ({
  id: `local-${i + 1}`,
  src: `${REELS_BASE_URL}${file}`,
}));

function getLiked(id: string) {
  return localStorage.getItem(`reel-like-${id}`) === "1";
}

const MAX_AUTO_RETRIES = 2;

function ReelItem({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(() => getLiked(reel.id));
  const [failed, setFailed] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const autoRetryCountRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const loadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            loadObserver.disconnect();
          }
        });
      },
      { rootMargin: "100% 0px 100% 0px" }
    );

    loadObserver.observe(container);

    return () => loadObserver.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;

    if (!video || !container || !shouldLoad) return;

    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: [0, 0.6, 1],
      }
    );

    playObserver.observe(container);

    return () => playObserver.disconnect();
  }, [shouldLoad, retryKey]);

  const toggleMute = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  const toggleLike = () => {
    const next = !liked;

    setLiked(next);
    localStorage.setItem(
      `reel-like-${reel.id}`,
      next ? "1" : "0"
    );
  };

  const handleError = () => {
    if (autoRetryCountRef.current < MAX_AUTO_RETRIES) {
      autoRetryCountRef.current += 1;

      setTimeout(() => {
        setRetryKey((key) => key + 1);
      }, 800);
    } else {
      setFailed(true);
    }
  };

  const manualRetry = () => {
    autoRetryCountRef.current = 0;
    setFailed(false);
    setRetryKey((key) => key + 1);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full snap-start shrink-0 bg-black flex items-center justify-center"
    >
      {failed ? (
        <button
          onClick={manualRetry}
          className="text-white/70 text-sm px-6 text-center flex flex-col items-center gap-2"
        >
          <span className="text-3xl">↻</span>
          <span>Couldn't load this reel. Tap to retry.</span>
        </button>
      ) : shouldLoad ? (
        <video
          key={retryKey}
          ref={videoRef}
          src={reel.src}
          className="w-full h-full object-contain"
          loop
          muted
          playsInline
          preload="auto"
          onClick={toggleMute}
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full bg-black" />
      )}

      {reel.caption && (
        <div className="absolute left-4 bottom-8 right-20 text-white drop-shadow-lg">
          {reel.userName && (
            <p className="font-semibold mb-1">
              @{reel.userName}
            </p>
          )}

          <p className="text-sm">
            {reel.caption}
          </p>
        </div>
      )}

      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5">
        <button
          onClick={toggleLike}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <span className="text-3xl drop-shadow-lg">
            {liked ? "❤️" : "🤍"}
          </span>
        </button>

        <button
          onClick={toggleMute}
          className="flex flex-col items-center gap-1"
          aria-label="Mute"
        >
          <span className="text-2xl drop-shadow-lg">
            {muted ? "🔇" : "🔊"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function Reels() {
  const [, setLocation] = useLocation();

  const [communityReels, setCommunityReels] = useState<Reel[]>([]);

  useEffect(() => {
    let active = true;

    async function loadCommunityPosts() {
      try {
        const posts = await getPosts();

        if (!active) return;

        const firebaseReels: Reel[] = posts
          .filter(
            (post: any) =>
              typeof post.videoUrl === "string" &&
              post.videoUrl.length > 0
          )
          .map((post: any) => ({
            id: post.id,
            src: post.videoUrl,
            caption: post.caption || "",
            userName: post.userName || "Learn Islam User",
          }));

        setCommunityReels(firebaseReels);
      } catch (error) {
        console.error("Could not load community posts:", error);
      }
    }

    loadCommunityPosts();

    return () => {
      active = false;
    };
  }, []);

  const allReels = [...communityReels, ...localReels];

  return (
    <div className="relative h-full w-full bg-black">
      <button
        onClick={() => setLocation("/create-post")}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 font-semibold shadow-lg"
      >
        <Plus className="w-5 h-5" />
        Create
      </button>

      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black">
        {allReels.map((reel) => (
          <ReelItem key={reel.id} reel={reel} />
        ))}
      </div>
    </div>
  );
            }
