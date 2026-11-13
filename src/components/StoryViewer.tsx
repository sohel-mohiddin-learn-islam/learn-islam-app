import { useEffect, useRef, useState } from "react";
import { deleteStory, getStoryViewers, markSeen, type Story, type StoryViewer } from "@/lib/stories";
import { getProfile, type UserProfile } from "@/lib/social";
import BoostStory from "./BoostStory";
import { sendMessage } from "@/lib/chat";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import OverlayLayer from "./OverlayLayer";
import { useBackClose } from "@/lib/backButton";
import { likeStory, recordStoryView } from "@/lib/analytics";

type Props = {
  ownerName: string;
  stories: Story[];
  onClose: () => void;
  onChanged?: () => void;
  /** highlights: no view tracking, no replies */
  readOnly?: boolean;
  /** highlights: owner can delete the whole highlight */
  onDeleteAll?: () => void;
};

const IMAGE_MS = 5000;

export default function StoryViewer({ ownerName, stories: initial, onClose, onChanged, readOnly, onDeleteAll }: Props) {
  const [, setLocation] = useLocation();
  useBackClose(onClose);
  const [stories, setStories] = useState<Story[]>(initial);
  const { user } = useAuth();
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [paused, setPaused] = useState(false);
  const [viewers, setViewers] = useState<StoryViewer[] | null>(null);
  const [showViewers, setShowViewers] = useState(false);
  const [vProfiles, setVProfiles] = useState<Record<string, UserProfile>>({});
  const [boost, setBoost] = useState(false);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (paused) audioRef.current?.pause();
    else audioRef.current?.play().catch(() => {});
  }, [paused, i]);

  const story = stories[i];
  const own = !!user && story?.ownerId === user.uid;

  useEffect(() => {
    if (!story) return onClose();
    if (!readOnly) markSeen(story.ownerId, story.createdAt);
    if (!readOnly && user) recordStoryView(story.ownerId, story.id, user.uid, story.closeOnly);
    setProgress(0);
    setLiked(false);
    setViewers(null);
    if (!readOnly && user && story.ownerId === user.uid) {
      getStoryViewers(user.uid, story).then(setViewers).catch(() => setViewers([]));
    }
  }, [i]);

  // viewers' names and pictures
  useEffect(() => {
    if (!showViewers || !viewers) return;
    viewers.forEach((v) => { if (!vProfiles[v.uid]) getProfile(v.uid).then((p) => setVProfiles((o) => ({ ...o, [v.uid]: p }))).catch(() => {}); });
  }, [showViewers, viewers?.length]);

  useEffect(() => { setPaused(showViewers || boost); }, [showViewers, boost]);

  // image timer
  useEffect(() => {
    if (!story || story.type !== "image" || paused) return;
    const start = Date.now() - progress * IMAGE_MS;
    const t = setInterval(() => {
      const p = (Date.now() - start) / IMAGE_MS;
      if (p >= 1) next();
      else setProgress(p);
    }, 80);
    return () => clearInterval(t);
  }, [i, paused]);

  const next = () => (i + 1 < stories.length ? setI(i + 1) : onClose());
  const prev = () => (i > 0 ? setI(i - 1) : setProgress(0));

  const sendReply = async () => {
    if (!user || !reply.trim()) return;
    try {
      await sendMessage(user.uid, story.ownerId, `↩️ Replied to your story: ${reply.trim()}`);
      setReply("");
      setNote("Reply sent");
    } catch (e: any) {
      setNote(e?.message || "Could not send reply.");
    }
  };

  const remove = async () => {
    if (!user || !confirm("Delete this story?")) return;
    await deleteStory(user.uid, story).catch(() => {});
    onChanged?.();
    const rest = stories.filter((x) => x.id !== story.id);
    if (rest.length === 0) return onClose();
    setStories(rest);
    setI(Math.min(i, rest.length - 1));
    setProgress(0);
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 p-3 pt-6">
        <div className="flex gap-1">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: idx < i ? "100%" : idx === i ? `${progress * 100}%` : "0%" }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-white">
          <span className="font-semibold drop-shadow">
            {ownerName} {story.closeOnly && <span className="text-xs bg-green-600 rounded px-1.5 py-0.5 ml-1">Close friends</span>}
          </span>
          <div className="flex items-center gap-4">
            {onDeleteAll && <button onClick={() => { if (confirm("Delete this highlight?")) { onDeleteAll(); onClose(); } }} aria-label="Delete highlight" className="text-xl">🗑</button>}
            {own && !readOnly && <button onClick={remove} aria-label="Delete story" className="text-xl">🗑</button>}
            <button onClick={onClose} aria-label="Close" className="text-3xl leading-none">×</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}>
        {(() => {
          const designed = Array.isArray(story.overlays);
          const fit = designed ? "object-cover" : "object-contain";
          const hasAudio = !!story.audioUrl;
          return (
            <div
              className="relative bg-black overflow-hidden"
              style={designed ? { aspectRatio: "9 / 16", height: "100%", maxWidth: "100%", containerType: "inline-size" } : { maxWidth: "100%", maxHeight: "100%" }}
            >
              {story.type === "video" ? (
                <video
                  key={story.id}
                  ref={videoRef}
                  src={story.mediaUrl}
                  className={designed ? `absolute inset-0 w-full h-full ${fit}` : "max-w-full max-h-full"}
                  autoPlay
                  muted={hasAudio}
                  playsInline
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (v.duration) setProgress(v.currentTime / v.duration);
                  }}
                  onEnded={next}
                  onLoadedData={(e) => {
                    const v = e.currentTarget;
                    if (hasAudio) return;
                    v.muted = false;
                    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
                  }}
                />
              ) : (
                <img key={story.id} src={story.mediaUrl} alt="" className={designed ? `absolute inset-0 w-full h-full ${fit}` : "max-w-full max-h-full object-contain"} />
              )}
              {designed && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <OverlayLayer overlays={story.overlays as any[]} onMention={(u) => { onClose(); setLocation(`/user/${u}`); }} />
                </div>
              )}
              {hasAudio && <audio key={`a-${story.id}`} ref={audioRef} src={story.audioUrl} autoPlay loop />}
              {hasAudio && (
                <div className="absolute bottom-2 left-3 right-3 text-xs bg-black/50 rounded-full px-3 py-1 truncate text-white">🎵 {story.audioTitle}</div>
              )}
            </div>
          );
        })()}
        <div className="absolute inset-y-24 left-0 w-1/3" onClick={prev} />
        <div className="absolute inset-y-24 right-0 w-1/3" onClick={next} />
      </div>

      {story.caption && (
        <div className="absolute left-0 right-0 bottom-24 px-6 text-center pointer-events-none">
          <span className="inline-block bg-black/60 text-white rounded-lg px-3 py-2 text-lg">{story.caption}</span>
        </div>
      )}
      {story.reelId && (
        <button
          onClick={() => { try { sessionStorage.setItem("reel-start", story.reelId!); } catch { /* ignore */ } onClose(); setLocation("/reels"); }}
          className="absolute left-1/2 -translate-x-1/2 bottom-36 z-10 bg-white/90 text-black rounded-full px-4 py-1.5 text-sm font-semibold"
        >
          ▶ Watch reel
        </button>
      )}

      {!own && !readOnly && user && (
        <div className="p-3 flex gap-2 bg-black/70">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            placeholder={`Reply to ${ownerName}…`}
            className="flex-1 bg-white/10 text-white rounded-full px-4 py-2 outline-none"
          />
          <button onClick={sendReply} className="text-white font-semibold px-3">Send</button>
          <button
            onClick={() => { const v = !liked; setLiked(v); likeStory(story.ownerId, story.id, user.uid, v, story.closeOnly); }}
            aria-label="Like story" className="text-2xl px-2"
          >{liked ? "❤️" : "🤍"}</button>
        </div>
      )}
      {own && !readOnly && (
        <div className="p-3 flex items-center gap-3 bg-black/70 text-white">
          <button onClick={() => setShowViewers(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10">
            👁 <span className="font-semibold">{viewers ? viewers.length : "…"}</span> <span className="text-sm text-white/70">viewers</span>
          </button>
          <button onClick={() => setBoost(true)} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500 font-semibold">📈 Boost</button>
        </div>
      )}
      {boost && <BoostStory story={story} ownerName={ownerName} onClose={() => setBoost(false)} />}
      {showViewers && (
        <div className="absolute inset-0 z-30 bg-neutral-950 text-white flex flex-col">
          <div className="flex items-center justify-between px-4 pt-6 pb-3 border-b border-white/10">
            <span className="font-semibold text-lg">👁 {viewers?.length ?? 0}</span>
            <div className="flex items-center gap-5">
              <button onClick={() => { setShowViewers(false); remove(); }} aria-label="Delete story" className="text-xl">🗑</button>
              <button onClick={() => setShowViewers(false)} aria-label="Close" className="text-3xl leading-none">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <button onClick={() => { setShowViewers(false); setBoost(true); }} className="w-full flex items-center gap-4 px-4 py-4 text-left">
              <span className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center text-2xl">📈</span>
              <span className="flex-1 text-lg font-semibold">Boost this story</span><span className="text-xl text-white/60">›</span>
            </button>
            <p className="px-4 py-3 text-xl font-semibold">Who viewed your story</p>
            {viewers === null && <p className="px-4 text-white/60">Loading…</p>}
            {viewers?.length === 0 && <p className="px-4 text-white/60">No views yet.</p>}
            {viewers?.map((v) => (
              <button key={v.uid} onClick={() => { onClose(); setLocation(`/user/${v.uid}`); }} className="w-full flex items-center gap-4 px-4 py-3 text-left">
                <span className="relative w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center">{vProfiles[v.uid]?.photoURL ? <img src={vProfiles[v.uid].photoURL!} alt="" className="w-full h-full object-cover" /> : "👤"}</span>
                  {v.liked && <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-xs">♥</span>}
                </span>
                <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{vProfiles[v.uid]?.displayName || "…"}</span>
                  <span className="block text-sm text-white/50">{v.at ? new Date(v.at).toLocaleString() : ""}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
      {note && <p className="text-center text-white/80 text-sm pb-2 bg-black/70">{note}</p>}
    </div>
  );
}
