import { useEffect, useRef, useState } from "react";
import { deleteStory, markSeen, type Story } from "@/lib/stories";
import { sendMessage } from "@/lib/chat";
import { useAuth } from "@/contexts/AuthContext";
import { useBackClose } from "@/lib/backButton";
import { recordStoryView } from "@/lib/analytics";

type Props = {
  ownerName: string;
  stories: Story[];
  onClose: () => void;
  onChanged?: () => void;
};

const IMAGE_MS = 5000;

export default function StoryViewer({ ownerName, stories: initial, onClose, onChanged }: Props) {
  useBackClose(onClose);
  const [stories, setStories] = useState<Story[]>(initial);
  const { user } = useAuth();
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const story = stories[i];
  const own = !!user && story?.ownerId === user.uid;

  useEffect(() => {
    if (!story) return onClose();
    markSeen(story.ownerId, story.createdAt);
    if (user && !story.closeOnly) recordStoryView(story.ownerId, story.id, user.uid);
    setProgress(0);
  }, [i]);

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
            {own && <button onClick={remove} aria-label="Delete story" className="text-xl">🗑</button>}
            <button onClick={onClose} aria-label="Close" className="text-3xl leading-none">×</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}>
        {story.type === "video" ? (
          <video
            key={story.id}
            ref={videoRef}
            src={story.mediaUrl}
            className="max-w-full max-h-full"
            autoPlay
            playsInline
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress(v.currentTime / v.duration);
            }}
            onEnded={next}
          />
        ) : (
          <img key={story.id} src={story.mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
        )}
        <div className="absolute inset-y-24 left-0 w-1/3" onClick={prev} />
        <div className="absolute inset-y-24 right-0 w-1/3" onClick={next} />
      </div>

      {!own && user && (
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
        </div>
      )}
      {note && <p className="text-center text-white/80 text-sm pb-2 bg-black/70">{note}</p>}
    </div>
  );
}
