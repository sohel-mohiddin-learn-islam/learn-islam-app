import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImage, uploadVideo } from "@/lib/posts";
import { addStory } from "@/lib/stories";
import { prepareAudio } from "@/lib/storyTools";
import { notify } from "@/lib/notifications";
import StoryEditor from "@/components/StoryEditor";

export default function CreateStory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const isVideo = !!file && file.type.startsWith("video/");

  const pick = (f?: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  if (file && preview) {
    return (
      <StoryEditor
        previewUrl={preview}
        type={isVideo ? "video" : "image"}
        onClose={() => { setFile(null); setPreview(null); }}
        onPublish={async ({ overlays, audio, closeOnly }) => {
          const url = isVideo ? await uploadVideo(file, user.uid) : await uploadImage(file);
          const a = await prepareAudio(audio, user.uid);
          await addStory(user.uid, url, isVideo ? "video" : "image", closeOnly, { overlays, ...a });
          overlays.filter((o) => o.kind === "mention" && o.uid).forEach((o) => notify(o.uid!, user.uid, "mention"));
          setLocation("/");
        }}
      />
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">New story</h1>
        </div>
        <label className="block border-2 border-dashed border-border rounded-xl py-20 text-center cursor-pointer">
          <span className="text-4xl block mb-2">📷</span>
          Choose a photo or video
          <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <p className="text-sm text-foreground/60 mt-4">Next you can add text, Islamic stickers, a naat and mentions. Stories disappear after 24 hours.</p>
      </div>
    </div>
  );
}
