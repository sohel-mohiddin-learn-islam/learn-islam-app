import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Image as ImageIcon, Camera, Video, ChevronRight } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { createPost, uploadThumbnail, uploadVideo } from "@/lib/posts";
import { searchUsers } from "@/lib/storyTools";
import { addStory } from "@/lib/stories";

// defined outside the page so typing in it does not lose focus
const Field = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="w-full bg-muted rounded-xl px-3 py-2.5 outline-none mb-3" />;

export default function CreatePost() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbBlob, setThumbBlob] = useState<Blob | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Instagram-style options
  const [open, setOpen] = useState<"" | "tag" | "location" | "link" | "audio" | "cover">("");
  const [location, setLocation_] = useState("");
  const [link, setLink] = useState("");
  const [audioName, setAudioName] = useState("");
  const [aiLabel, setAiLabel] = useState(false);
  const [audience, setAudience] = useState<"everyone" | "followers">("everyone");
  const [hideLikes, setHideLikes] = useState(false);
  const [hideShares, setHideShares] = useState(false);
  const [commentsOff, setCommentsOff] = useState(false);
  const [shareStory, setShareStory] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [when, setWhen] = useState("");
  const [tagged, setTagged] = useState<{ uid: string; name: string }[]>([]);
  const [tagQ, setTagQ] = useState("");
  const [tagRes, setTagRes] = useState<{ uid: string; name: string; photo: string | null }[]>([]);
  const toggle = (k: typeof open) => setOpen((o) => (o === k ? "" : k));
  const searchTag = async (q: string) => {
    setTagQ(q);
    if (!q.trim()) { setTagRes([]); return; }
    const cap = q.trim()[0].toUpperCase() + q.trim().slice(1);
    const [a, b] = await Promise.all([searchUsers(q.trim()).catch(() => []), searchUsers(cap).catch(() => [])]);
    const m = new Map([...a, ...b].map((u) => [u.uid, u])); setTagRes(Array.from(m.values()).filter((u) => u.uid !== user?.uid));
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }

    // Keep the first public version reasonably small.
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("Video must be smaller than 100 MB.");
      return;
    }

    setFile(selectedFile);

    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const setThumb = (blob: Blob) => {
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbBlob(blob);
    setThumbPreview(URL.createObjectURL(blob));
  };

  const handleThumbFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please select an image for the thumbnail.");
      return;
    }
    setError("");
    setThumb(f);
  };

  // take the picture from the video at the moment you paused it
  const captureFrame = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      setError("Play the video a little first, then pause on the frame you want.");
      return;
    }
    const scale = Math.min(1, 720 / v.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (b) => {
        if (b) {
          setError("");
          setThumb(b);
        }
      },
      "image/jpeg",
      0.85
    );
  };

  const clearThumb = () => {
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbBlob(null);
    setThumbPreview("");
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  };

  const removeVideo = () => {
    clearThumb();
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video.");
      return;
    }

    if (!user) {
      setError("Please sign in first.");
      return;
    }
    if (link.trim() && !/^https?:\/\//i.test(link.trim())) { setError("The link must start with http:// or https://"); return; }
    if (schedule && (!when || new Date(when).getTime() < Date.now() + 60000)) { setError("Pick a date and time in the future to schedule."); return; }

    setError("");
    setUploading(true);

    try {
      setProgress(0);
      setStage("");
      const videoUrl = await uploadVideo(file, user.uid, (p) => {
        setProgress(p);
        if (p >= 99) setStage("Processing video…");
      });
      setStage("Uploading thumbnail…");
      const thumbnailUrl = thumbBlob ? await uploadThumbnail(thumbBlob) : null;

      setStage("Saving post…");
      await createPost({
        userId: user.uid,
        userName: user.displayName || "Learn Islam User",
        userPhoto: user.photoURL || null,
        caption: caption.trim(),
        videoUrl,
        thumbnailUrl,
        extra: {
          audience, location: location.trim(), link: link.trim(), audioName: audioName.trim(), aiLabel, hideLikes, hideShares, commentsOff, tagged,
          publishAt: schedule && when ? new Date(when).getTime() : null,
        },
      });
      if (shareStory && !(schedule && when)) { try { await addStory(user.uid, videoUrl, "video", false, { caption: caption.trim() }); } catch { /* story is optional */ } }

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      try { sessionStorage.setItem("reel-start", "mine-latest"); } catch { /* ignore */ }
      setLocation("/reels");
    } catch (err) {
      console.error(err);
      setError(
        (err instanceof Error && err.message) ||
          "Upload failed. Please check your internet connection and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const Toggle = ({ on, set, label, sub, disabled }: { on: boolean; set: (v: boolean) => void; label: string; sub?: string; disabled?: boolean }) => (
    <button type="button" disabled={disabled || uploading} onClick={() => set(!on)} className="w-full flex items-center gap-3 py-3 text-left">
      <span className="flex-1"><span className="block">{label}</span>{sub && <span className="block text-xs text-foreground/50 mt-0.5">{sub}</span>}</span>
      <span className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${on ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`block w-5 h-5 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} /></span>
    </button>
  );
  const RowBtn = ({ k, icon, label, value }: { k: typeof open; icon: string; label: string; value?: string }) => (
    <button type="button" onClick={() => toggle(k)} className="w-full flex items-center gap-3 py-3.5 text-left">
      <span className="w-6 text-center text-lg">{icon}</span>
      <span className="flex-1">{label}</span>
      {value && <span className="text-sm text-foreground/50 truncate max-w-[45%]">{value}</span>}
      <ChevronRight className={`w-5 h-5 text-foreground/40 transition ${open === k ? "rotate-90" : ""}`} />
    </button>
  );

  return (
    <div className="min-h-full bg-background text-foreground">
      <input ref={fileInputRef} type="file" accept="video/*,.mp4,.mov,.webm,application/octet-stream" onChange={handleFileChange} className="hidden" />
      <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbFile} className="hidden" />
      <div className="max-w-lg mx-auto pb-2">
        <div className="flex items-center gap-4 px-4 py-3 sticky top-0 bg-background z-10">
          <button onClick={() => (preview ? removeVideo() : setLocation("/reels"))} disabled={uploading} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-bold">New reel</h1>
        </div>

        {!preview ? (
          <div className="px-4">
            <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-[9/12] rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"><Video className="w-8 h-8 text-primary" /></div>
              <p className="font-semibold">Select a video</p>
              <p className="text-sm text-foreground/60">MP4 and other video formats · up to 100 MB</p>
            </button>
          </div>
        ) : (
          <div className="flex justify-center px-4">
            <div className="relative w-44 aspect-[9/16] rounded-3xl overflow-hidden bg-black">
              {thumbPreview && open !== "cover" ? <img src={thumbPreview} alt="" className="w-full h-full object-cover" /> : <video ref={videoRef} src={preview} controls={open === "cover"} playsInline muted preload="metadata" className="w-full h-full object-cover" />}
              <button type="button" onClick={() => toggle("cover")} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm rounded-full px-3 py-1 whitespace-nowrap">Edit cover</button>
            </div>
          </div>
        )}

        {preview && open === "cover" && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-card border border-border text-sm flex flex-col gap-2">
            <p className="text-xs text-foreground/60">Pause the preview on the frame you want, then tap “Use current frame”.</p>
            <button type="button" onClick={captureFrame} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"><Camera className="w-4 h-4" /> Use current frame</button>
            <button type="button" onClick={() => thumbInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"><ImageIcon className="w-4 h-4" /> Choose a picture</button>
            {thumbPreview && <button type="button" onClick={clearThumb} className="text-left text-red-400 px-1">Remove cover</button>}
          </div>
        )}

        <div className="px-4 mt-4">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption and add hashtags…" maxLength={500} rows={3} disabled={uploading} className="w-full bg-transparent resize-none outline-none text-base" />
          <div className="flex items-center gap-2 mb-1">
            <button type="button" onClick={() => setCaption((c) => (c && !/\s$/.test(c) ? c + " #" : c + "#"))} className="px-3 py-1.5 rounded-xl bg-muted text-sm font-semibold"># Hashtags</button>
            <span className="ml-auto text-xs text-foreground/40">{caption.length}/500</span>
          </div>

          <div className="divide-y divide-border border-t border-border mt-3">
            <div>
              <RowBtn k="tag" icon="👤" label="Tag people" value={tagged.length ? `${tagged.length} tagged` : ""} />
              {open === "tag" && (
                <div className="pb-3">
                  {tagged.length > 0 && <div className="flex flex-wrap gap-2 mb-2">{tagged.map((t) => <button key={t.uid} onClick={() => setTagged((x) => x.filter((y) => y.uid !== t.uid))} className="px-2.5 py-1 rounded-full bg-primary/15 text-sm">{t.name} ✕</button>)}</div>}
                  <Field value={tagQ} onChange={(e) => searchTag(e.target.value)} placeholder="Search a name…" />
                  {tagRes.map((u) => (
                    <button key={u.uid} type="button" onClick={() => { if (!tagged.some((t) => t.uid === u.uid) && tagged.length < 10) setTagged((x) => [...x, { uid: u.uid, name: u.name }]); setTagQ(""); setTagRes([]); }} className="w-full flex items-center gap-3 py-1.5 text-left">
                      <span className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">{u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> : "👤"}</span>{u.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <RowBtn k="location" icon="📍" label="Add location" value={location} />
              {open === "location" && <Field value={location} onChange={(e) => setLocation_(e.target.value)} placeholder="City or place" maxLength={80} />}
            </div>
            <div>
              <RowBtn k="link" icon="🔗" label="Add link" value={link.replace(/^https?:\/\//, "")} />
              {open === "link" && <Field value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" inputMode="url" maxLength={300} />}
            </div>
            <div>
              <RowBtn k="audio" icon="🎵" label="Rename audio" value={audioName || "Original audio"} />
              {open === "audio" && <Field value={audioName} onChange={(e) => setAudioName(e.target.value)} placeholder="Original audio" maxLength={60} />}
            </div>
            <Toggle on={aiLabel} set={setAiLabel} label="✨ Add AI label" sub="Required for realistic photos and videos made with AI. People will see it on your content." />
          </div>

          <div className="border-t-8 border-muted/60 -mx-4 px-4 mt-1 divide-y divide-border">
            <button type="button" disabled={uploading} onClick={() => setAudience((a) => (a === "everyone" ? "followers" : "everyone"))} className="w-full flex items-center gap-3 py-3.5 text-left">
              <span className="w-6 text-center text-lg">👁️</span><span className="flex-1">Audience</span>
              <span className="text-sm text-foreground/50">{audience === "everyone" ? "Everyone" : "Followers only"}</span><ChevronRight className="w-5 h-5 text-foreground/40" />
            </button>
            <Toggle on={schedule} set={setSchedule} label="🕒 Schedule this reel" sub="It appears for others at the time you pick." />
            {schedule && <div className="py-2"><Field type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>}
            <Toggle on={shareStory} set={setShareStory} label="⭕ Also share to your story" disabled={schedule} />
          </div>

          <div className="border-t-8 border-muted/60 -mx-4 px-4 divide-y divide-border">
            <p className="py-2.5 text-sm font-semibold text-foreground/60">How others can interact with your reel</p>
            <Toggle on={hideLikes} set={setHideLikes} label="Hide like count on this reel" />
            <Toggle on={hideShares} set={setHideShares} label="Hide share count on this reel" sub="Only you will see the number of likes and shares on this reel." />
            <Toggle on={commentsOff} set={setCommentsOff} label="Turn off commenting" />
          </div>

          {error && <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-3">
          <div className="max-w-lg mx-auto">
            <button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold disabled:opacity-50">
              {uploading ? (stage || `Uploading ${progress}%`) : schedule ? "Schedule" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
