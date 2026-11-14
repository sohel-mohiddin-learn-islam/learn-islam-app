import { useEffect, useRef, useState } from "react";
import AvatarArt, { type AvatarCfg } from "@/components/AvatarArt";

/** Profile picture: flips between the photo and the cartoon avatar, and a long press shows it big (release to close). */
export default function ProfilePic({
  photoURL, avatar, size = 84, ring = "", onTap, label,
}: { photoURL?: string | null; avatar?: AvatarCfg | null; size?: number; ring?: string; onTap?: () => void; label?: string }) {
  const [face, setFace] = useState<"photo" | "avatar">("photo");
  const [big, setBig] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const hasBoth = !!avatar && !!photoURL;
  const showAvatar = !!avatar && (!photoURL || face === "avatar");

  useEffect(() => {
    if (!hasBoth || big) return;
    const t = setInterval(() => setFace((f) => (f === "photo" ? "avatar" : "photo")), 3500);
    return () => clearInterval(t);
  }, [hasBoth, big]);

  const start = () => {
    held.current = false;
    timer.current = setTimeout(() => { held.current = true; setBig(true); }, 350);
  };
  const end = () => {
    if (timer.current) clearTimeout(timer.current);
    if (held.current) setBig(false);
  };

  const art = (px: number, wave: boolean) =>
    showAvatar && avatar ? (
      <AvatarArt cfg={avatar} size={px} wave={wave} />
    ) : photoURL ? (
      <img src={photoURL} alt="" draggable={false} style={{ width: px, height: px }} className="rounded-full object-cover bg-muted" />
    ) : (
      <div style={{ width: px, height: px }} className="rounded-full bg-muted flex items-center justify-center text-3xl">👤</div>
    );

  return (
    <>
      <button
        onPointerDown={start} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => { if (held.current) { held.current = false; return; } onTap?.(); }}
        className={`rounded-full p-0.5 select-none touch-manipulation ${ring}`}
        style={{ WebkitTouchCallout: "none" }}
        aria-label={label || "Profile photo"}
      >
        <span className="block" style={{ perspective: 600 }}>
          <span key={showAvatar ? "a" : "p"} className="block" style={{ animation: hasBoth ? "pflip .6s ease" : undefined }}>{art(size, showAvatar)}</span>
        </span>
        <style>{`@keyframes pflip{from{transform:rotateY(90deg);opacity:.2}to{transform:rotateY(0);opacity:1}}`}</style>
      </button>
      {big && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center pointer-events-none" style={{ animation: "pop .18s ease" }}>
          <div className="rounded-full overflow-hidden shadow-2xl border-4 border-white/80" style={{ width: "min(78vw, 340px)", height: "min(78vw, 340px)" }}>
            {art(340, showAvatar)}
          </div>
          <style>{`@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}
    </>
  );
}
