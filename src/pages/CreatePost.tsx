import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Upload, Video, X } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { createPost, uploadVideo } from "@/lib/posts";

export default function CreatePost() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const removeVideo = () => {
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
      const videoUrl = await uploadVideo(file, user.uid);

      await createPost({
        userId: user.uid,
        userName: user.displayName || "Learn Islam User",
        userPhoto: user.photoURL || null,
        caption: caption.trim(),
        videoUrl,
      });

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setLocation("/reels");
    } catch (err) {
      console.error(err);
      setError(
        "Upload failed. Please check Firebase Storage and try again."
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
              src={preview}
              controls
              playsInline
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
            placeholder="Write something about this video..."
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

          {uploading ? "Uploading..." : "Publish Video"}
        </button>

        <p className="text-xs text-center text-foreground/50 mt-4">
          Your video will be stored securely in Firebase.
        </p>
      </div>
    </div>
  );
                }
