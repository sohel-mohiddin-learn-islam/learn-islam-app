import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { setPrefs, toggleSaved, usePrefs } from "@/lib/prefs";
import { getRelations } from "@/lib/social";
import ShareSheet from "@/components/ShareSheet";
import CommentsSheet from "@/components/CommentsSheet";
import { notify } from "@/lib/notifications";
import { compact, getReelCounts, recordReelView, recordShare, setSaveMarker, type ReelCounts } from "@/lib/analytics";
import { follow as followUser, getFollowingIds } from "@/lib/social";
import { db } from "@/lib/firebase";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
import { getActiveAds, type Ad } from "@/lib/ads";

import { deletePost, getPosts, optimizedVideoUrl, postThumbnail } from "@/lib/posts";

type Reel = {
  id: string;
  src: string;
  original?: string;
  poster?: string;
  caption?: string;
  userName?: string;
  userId?: string;
};

function getLiked(id: string) {
  return localStorage.getItem(`reel-like-${id}`) === "1";
}

const MAX_AUTO_RETRIES = 2;

function ReelItem({ reel, isOwn, onDelete, followingIds, onFollowed, onNotInterested }: { reel: Reel; isOwn?: boolean; onDelete?: (reel: Reel) => void; followingIds: string[]; onFollowed: (uid: string) => void; onNotInterested: (id: string) => void }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const prefs = usePrefs();
  const saved = prefs.saved.includes(reel.id);
  const [showComments, setShowComments] = useState(false);
  const [counts, setCounts] = useState<ReelCounts>({ likes: 0, comments: 0, shares: 0, saves: 0 });
  const [menu, setMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const viewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCommunity = !reel.id.startsWith("local-");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(() => getLiked(reel.id));
  const [failed, setFailed] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [useOriginal, setUseOriginal] = useState(false);

  const autoRetryCountRef = useRef(0);

  useEffect(() => {
    if (shouldLoad && isCommunity) getReelCounts(reel.id).then(setCounts);
  }, [shouldLoad]);

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
            if (user && isCommunity && reel.userId && !viewTimer.current) {
              viewTimer.current = setTimeout(() => recordReelView(reel.id, reel.userId!, user.uid), 1500);
            }
          } else {
            video.pause();
            if (viewTimer.current) {
              clearTimeout(viewTimer.current);
              viewTimer.current = null;
            }
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

    // real like: stored for the reel and the owner gets a notification
    if (user && !reel.id.startsWith("local-")) {
      const likeRef = doc(db, "posts", reel.id, "likes", user.uid);
      if (next) {
        setDoc(likeRef, { userId: user.uid, createdAt: Date.now() }).catch(() => {});
        setCounts((c) => ({ ...c, likes: c.likes + 1 }));
        if (reel.userId) notify(reel.userId, user.uid, "like", { postId: reel.id, thumb: reel.poster });
      } else {
        deleteDoc(likeRef).catch(() => {});
        setCounts((c) => ({ ...c, likes: Math.max(0, c.likes - 1) }));
      }
    }
  };

  const handleError = () => {
    // the phone-friendly copy may not exist yet: fall back to the original file
    if (reel.original && !useOriginal) {
      setUseOriginal(true);
      setRetryKey((key) => key + 1);
      return;
    }
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
          src={useOriginal && reel.original ? reel.original : reel.src}
          poster={reel.poster}
          className="w-full h-full object-contain"
          loop
          muted
          playsInline
          preload={reel.original ? "metadata" : "auto"}
          onClick={toggleMute}
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full bg-black" />
      )}

      {reel.caption && (
        <div className="absolute left-4 bottom-8 right-20 text-white drop-shadow-lg">
          {reel.userName && (
            <div className="flex items-center gap-3 mb-1">
              <p
                className="font-semibold cursor-pointer"
                onClick={() => reel.userId && setLocation(`/user/${reel.userId}`)}
              >
                @{reel.userName}
              </p>
              {user && reel.userId && !isOwn && !followingIds.includes(reel.userId) && (
                <button
                  onClick={async () => {
                    onFollowed(reel.userId!);
                    await followUser(user.uid, reel.userId!).catch(() => {});
                    notify(reel.userId!, user.uid, "follow");
                  }}
                  className="border border-white rounded-lg px-3 py-0.5 text-sm font-semibold"
                >
                  Follow
                </button>
              )}
            </div>
          )}

          <p className="text-sm">
            {reel.caption}
          </p>
        </div>
      )}

      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 text-white">
        <button onClick={toggleLike} className="flex flex-col items-center" aria-label="Like">
          <span className="text-3xl drop-shadow-lg">{liked ? "❤️" : "🤍"}</span>
          {isCommunity && <span className="text-xs drop-shadow">{compact(counts.likes)}</span>}
        </button>

        {isCommunity && (
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center" aria-label="Comments">
            <span className="text-3xl drop-shadow-lg">💬</span>
            <span className="text-xs drop-shadow">{compact(counts.comments)}</span>
          </button>
        )}

        {isCommunity && (
          <button
            onClick={() => setShowShare(true)}
            className="flex flex-col items-center"
            aria-label="Share"
          >
            <span className="text-3xl drop-shadow-lg">📤</span>
            <span className="text-xs drop-shadow">{compact(counts.shares)}</span>
          </button>
        )}

        {isCommunity && (
          <button
            onClick={() => {
              const next = toggleSaved(reel.id);
              if (user) {
                setSaveMarker(reel.id, user.uid, next);
                setCounts((c) => ({ ...c, saves: Math.max(0, c.saves + (next ? 1 : -1)) }));
              }
            }}
            className="flex flex-col items-center"
            aria-label="Save"
          >
            <span className="text-3xl drop-shadow-lg">{saved ? "🔖" : "📑"}</span>
            <span className="text-xs drop-shadow">{compact(counts.saves)}</span>
          </button>
        )}

        <button onClick={toggleMute} className="flex flex-col items-center" aria-label="Mute">
          <span className="text-2xl drop-shadow-lg">{muted ? "🔇" : "🔊"}</span>
        </button>

        {isCommunity && (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="text-2xl drop-shadow-lg" aria-label="More">⋯</button>
            {menu && (
              <div className="absolute right-0 bottom-9 z-20 bg-black/85 rounded-lg overflow-hidden text-sm whitespace-nowrap">
                {isOwn && onDelete && (
                  <button onClick={() => { setMenu(false); onDelete(reel); }} className="block w-full text-left px-4 py-2.5 text-red-400">
                    🗑 Delete
                  </button>
                )}
                {!isOwn && (
                  <button onClick={() => { setMenu(false); onNotInterested(reel.id); }} className="block w-full text-left px-4 py-2.5">
                    ✕ Not interested
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showShare && (
        <ShareSheet
          reel={reel}
          onClose={() => setShowShare(false)}
          onShared={() => {
            if (!user) return;
            // one share per person: repeated actions do not add to the count
            const key = `reel-shared-${reel.id}-${user.uid}`;
            let already = false;
            try { already = localStorage.getItem(key) === "1"; localStorage.setItem(key, "1"); } catch { /* ignore */ }
            if (!already) {
              recordShare(reel.id, user.uid);
              setCounts((c) => ({ ...c, shares: c.shares + 1 }));
            }
          }}
        />
      )}

      {showComments && (
        <CommentsSheet postId={reel.id} postOwnerId={reel.userId} thumb={reel.poster} onClose={() => setShowComments(false)} />
      )}
    </div>
  );
}

function AdItem({ ad }: { ad: Ad }) {
  return (
    <div className="relative w-full h-full snap-start shrink-0 bg-black flex items-center justify-center">
      {ad.mediaType === "video" ? (
        <video src={ad.mediaUrl} className="h-full w-full object-contain" autoPlay muted loop playsInline />
      ) : (
        <img src={ad.mediaUrl} alt="" className="h-full w-full object-contain" />
      )}
      <div className="absolute left-4 right-20 bottom-8 text-white drop-shadow-lg">
        <span className="inline-block text-xs bg-white/25 rounded px-2 py-0.5 mb-2">Sponsored</span>
        <p className="font-semibold">{ad.title}</p>
        {ad.text && <p className="text-sm opacity-90">{ad.text}</p>}
        {ad.link && (
          <button onClick={() => window.open(ad.link, "_blank")} className="mt-3 rounded-lg bg-primary text-primary-foreground px-5 py-2 font-semibold">
            Learn more
          </button>
        )}
      </div>
    </div>
  );
}

export default function Reels() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [hidden, setHidden] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [tab, setTab] = useState<"reels" | "friends">("reels");
  const prefs = usePrefs();

  useEffect(() => {
    if (!user) return;
    getFollowingIds(user.uid).then(setFollowingIds).catch(() => {});
    getRelations(user.uid).then((r) => setHidden([...r.blocked, ...r.muted])).catch(() => {});
  }, [user?.uid]);

  const handleDelete = async (reel: Reel) => {
    if (!user || !confirm("Delete this reel? This cannot be undone.")) return;
    try {
      await deletePost(reel.id, user.uid, reel.original);
      setCommunityReels((r) => r.filter((x) => x.id !== reel.id));
    } catch (e: any) {
      alert(e?.message || "Could not delete the reel.");
    }
  };

  const [communityReels, setCommunityReels] = useState<Reel[]>([]);
  const [seed, setSeed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [startId, setStartId] = useState<string | null>(() => {
    try {
      const v = sessionStorage.getItem("reel-start") || new URLSearchParams(window.location.search).get("reel");
      sessionStorage.removeItem("reel-start");
      return v;
    } catch {
      return null;
    }
  });
  const [ads, setAds] = useState<Ad[]>([]);
  useEffect(() => { getActiveAds().then(setAds).catch(() => {}); }, [seed]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchY = useRef<number | null>(null);
  const lastWheel = useRef(0);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setStartId(null);
    setSeed((n) => n + 1);
    scrollRef.current?.scrollTo({ top: 0 });
    setTimeout(() => setRefreshing(false), 1200);
  };

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
              post.videoUrl.length > 0 &&
              !post.archived &&
              !hidden.includes(post.userId)
          )
          .map((post: any) => ({
            id: post.id,
            src: optimizedVideoUrl(post.videoUrl),
            original: post.videoUrl,
            poster: postThumbnail(post),
            caption: post.caption || "",
            userName: post.userName || "Learn Islam User",
            userId: post.userId,
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
  }, [hidden.join(","), seed]);

  // random order, fixed until the next refresh; the reel opened from a profile / just uploaded goes first
  const ordered = useMemo(() => {
    const shuffled = [...communityReels].sort(() => Math.random() - 0.5);
    if (startId) {
      const target =
        startId === "mine-latest"
          ? communityReels.find((r) => user && r.userId === user.uid)
          : communityReels.find((r) => r.id === startId);
      if (target) return [target, ...shuffled.filter((r) => r.id !== target.id)];
    }
    return shuffled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityReels, seed, startId, user?.uid]);

  const allReels = ordered
    .filter((r) => !prefs.notInterested.includes(r.id))
    .filter((r) => tab !== "friends" || (r.userId && followingIds.includes(r.userId)));

  return (
    <div className="relative h-full w-full bg-black">
      <button
        onClick={() => setLocation("/create-post")}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 font-semibold shadow-lg"
      >
        <Plus className="w-5 h-5" />
        Create
      </button>

      <div className="absolute top-4 left-4 z-50 flex gap-5 text-lg font-semibold drop-shadow-lg">
        {(["reels", "friends"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "text-white" : "text-white/50"}>
            {t === "reels" ? "Reels" : "Friends"}
          </button>
        ))}
      </div>

      {refreshing && (
        <div className="absolute top-16 left-0 right-0 z-40 text-center text-white/80 text-sm">Refreshing reels…</div>
      )}

      <div
        ref={scrollRef}
        onTouchStart={(e) => { touchY.current = scrollRef.current && scrollRef.current.scrollTop <= 0 ? e.touches[0].clientY : null; }}
        onTouchEnd={(e) => {
          if (touchY.current !== null && e.changedTouches[0].clientY - touchY.current > 90) refresh();
          touchY.current = null;
        }}
        onWheel={(e) => {
          if (e.deltaY < -40 && (scrollRef.current?.scrollTop ?? 1) <= 0 && Date.now() - lastWheel.current > 1500) {
            lastWheel.current = Date.now();
            refresh();
          }
        }}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black"
      >
        {allReels.length === 0 && tab === "friends" && (
          <p className="text-white/70 text-center pt-40 px-8">
            Reels from people you follow will show up here. Follow someone from the Reels tab.
          </p>
        )}
        {allReels.length === 0 && tab === "reels" && (
          <p className="text-white/70 text-center pt-40 px-8">No reels yet. Tap Create to post the first one, or pull down to refresh.</p>
        )}
        {allReels.map((reel, i) => (
          <Fragment key={reel.id}>
            <ReelItem
              reel={reel}
              isOwn={!!user && reel.userId === user.uid}
              onDelete={handleDelete}
              followingIds={followingIds}
              onFollowed={(uid) => setFollowingIds((f) => [...f, uid])}
              onNotInterested={(id) => setPrefs({ notInterested: [...prefs.notInterested, id] })}
            />
            {tab === "reels" && ads.length > 0 && (i + 1) % 4 === 0 && <AdItem ad={ads[Math.floor(i / 4) % ads.length]} />}
          </Fragment>
        ))}
      </div>
    </div>
  );
            }
