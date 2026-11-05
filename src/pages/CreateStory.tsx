import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImage, uploadVideo } from "@/lib/posts";
import { addStory } from "@/lib/stories";

export default function CreateStory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [closeOnly, setCloseOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  if (!user) {
    setLocation("/login");
    return null;
  }

  const isVideo = !!file && file.type.startsWith("video/");

  const pick = (f?: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const share = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = isVideo ? await uploadVideo(file, user.uid, setProgress) : await uploadImage(file);
      await addStory(user.uid, url, isVideo ? "video" : "image", closeOnly);
      setLocation("/");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Could not share your story. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">New story</h1>
        </div>

        {preview ? (
          <div className="rounded-xl overflow-hidden bg-black mb-4 flex justify-center">
            {isVideo ? (
              <video src={preview} controls playsInline className="max-h-[60vh]" />
            ) : (
              <img src={preview} alt="" className="max-h-[60vh] object-contain" />
            )}
          </div>
        ) : (
          <label className="block border-2 border-dashed border-border rounded-xl py-16 text-center cursor-pointer mb-4">
            <span className="text-4xl block mb-2">📷</span>
            Choose a photo or video
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        )}

        {preview && (
          <label className="text-sm text-primary underline cursor-pointer block mb-4">
            Choose a different file
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        )}

        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1">
            <p className="font-semibold">Close friends only</p>
            <p className="text-sm text-foreground/60">Only people on your Close Friends list can see this story.</p>
          </div>
          <button
            onClick={() => setCloseOnly((v) => !v)}
            className={`w-12 h-7 rounded-full relative ${closeOnly ? "bg-green-600" : "bg-muted border border-border"}`}
            aria-pressed={closeOnly}
          >
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${closeOnly ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        <p className="text-sm text-foreground/60 mb-4">Stories disappear after 24 hours. Only people who follow you can see them.</p>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <button
          onClick={share}
          disabled={!file || busy}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold disabled:opacity-50"
        >
          {busy ? (isVideo ? `Uploading ${progress}%` : "Sharing…") : "Share story"}
        </button>
      </div>
    </div>
  );
}
