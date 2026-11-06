import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addStory } from "@/lib/stories";
import { useBackClose } from "@/lib/backButton";

/** Instagram-style "add to story" editor for a reel: preview, caption, choose audience, share. */
export default function StoryComposer({ reel, onClose, onDone }: { reel: { id: string; original?: string; src: string; poster?: string }; onClose: () => void; onDone: () => void }) {
  useBackClose(onClose);
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const share = async (closeOnly: boolean) => {
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      await addStory(user.uid, reel.original || reel.src, "video", closeOnly, { caption: caption.trim().slice(0, 120), reelId: reel.id });
      onDone();
    } catch (e: any) {
      setError(e?.message || "Could not share to your story.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black flex flex-col text-white">
      <div className="flex-1 m-3 mb-0 rounded-3xl bg-neutral-900 relative overflow-hidden flex flex-col">
        <button onClick={onClose} aria-label="Back" className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full bg-black/50 text-2xl flex items-center justify-center">←</button>
        <div className="flex-1 flex items-center justify-center bg-black m-6 mt-20 rounded-2xl overflow-hidden relative">
          <video src={reel.src} poster={reel.poster} className="max-h-full max-w-full" autoPlay muted loop playsInline />
          {caption && (
            <span className="absolute bottom-6 left-4 right-4 text-center">
              <span className="inline-block bg-black/60 rounded-lg px-3 py-2 text-lg">{caption}</span>
            </span>
          )}
        </div>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={120}
          placeholder="Add a caption…"
          className="bg-transparent px-6 py-4 outline-none placeholder:text-white/60"
        />
      </div>
      {error && <p className="text-red-400 text-sm text-center pt-2">{error}</p>}
      <div className="flex gap-3 p-3 pb-6">
        <button disabled={busy} onClick={() => share(false)} className="flex-1 rounded-full bg-white/10 py-4 font-semibold disabled:opacity-50">
          {busy ? "Sharing…" : "Your story"}
        </button>
        <button disabled={busy} onClick={() => share(true)} className="flex-1 rounded-full bg-white/10 py-4 font-semibold disabled:opacity-50">
          <span className="inline-block w-5 h-5 rounded-full bg-green-500 mr-2 align-middle text-xs leading-5">★</span>Close Friends
        </button>
      </div>
    </div>
  );
}
