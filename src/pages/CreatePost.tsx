import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Image as ImageIcon, Camera, Upload, Video, X } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { createPost, uploadThumbnail, uploadVideo } from "@/lib/posts";

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
      });

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

  return (
    <div className="min-h-full bg-background p-5">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif text-primary">
              Create Post
            </h1>

            <p className="text-sm text-foreground/60 mt-1">
              Share an Islamic video with the community
            </p>
          </div>

          <button
            onClick={() => setLocation("/reels")}
            className="p-2 rounded-full bg-muted"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!preview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 hover:bg-muted transition"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="w-8 h-8 text-primary" />
            </div>

            <div className="text-center">
              <p className="font-semibold">
                Select a video
              </p>

              <p className="text-sm text-foreground/60 mt-1">
                MP4 and other supported video formats
              </p>
            </div>
          </button>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={preview}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[65vh] object-contain"
            />

            <button
              onClick={removeVideo}
              disabled={uploading}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {preview && (
          <div className="mt-5">
            <label className="text-sm font-medium">Thumbnail</label>

            <div className="mt-2 flex items-center gap-3">
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
                {thumbPreview ? (
                  <img src={thumbPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-foreground/40" />
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                >
                  <ImageIcon className="w-4 h-4" /> Choose picture
                </button>
                <button
                  type="button"
                  onClick={captureFrame}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                >
                  <Camera className="w-4 h-4" /> Use current video frame
                </button>
                {thumbPreview && (
                  <button type="button" onClick={clearThumb} disabled={uploading} className="text-left text-red-400 px-1">
                    Remove thumbnail
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-foreground/50 mt-2">
              No thumbnail chosen? We use the first second of your video.
            </p>

            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbFile}
              className="hidden"
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-5">
          <label className="text-sm font-medium">
            Caption
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption… add #hashtags so people can find it"
            maxLength={500}
            rows={4}
            disabled={uploading}
            className="w-full mt-2 bg-card border border-border rounded-xl p-3 text-foreground resize-none outline-none focus:border-primary"
          />

          <div className="text-right text-xs text-foreground/50 mt-1">
            {caption.length}/500
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full mt-5 bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Upload className="w-5 h-5" />

          {uploading ? (stage || `Uploading ${progress}%`) : "Publish Video"}
        </button>

        <p className="text-xs text-center text-foreground/50 mt-4">
          In shaa Allah, your Reel is safe with us 🤍
        </p>
      </div>
    </div>
  );
}
