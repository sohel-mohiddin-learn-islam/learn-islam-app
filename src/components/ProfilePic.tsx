import { useEffect, useRef, useState } from "react";

const isPack = (u?: string | null) => !!u && u.includes("/avatars/");

/**
 * Profile picture. If the user has both a photo and a chosen avatar (from the avatar pictures), the picture
 * switches between the two, with no animation. A long press shows it big (release to close).
 */
export default function ProfilePic({
  photoURL, avatarPic, size = 84, ring = "", onTap, label,
}: { photoURL?: string | null; avatarPic?: string | null; size?: number; ring?: string; onTap?: () => void; label?: string }) {
  // an avatar chosen before avatars were separate lives in photoURL
  const avatar = avatarPic || (isPack(photoURL) ? photoURL! : null);
  const photo = isPack(photoURL) ? null : photoURL || null;
  const [showAvatar, setShowAvatar] = useState(!photo);
  const [big, setBig] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const both = !!avatar && !!photo;
  const src = both ? (showAvatar ? avatar : photo) : avatar || photo;

  useEffect(() => {
    if (!both || big) return;
    const t = setInterval(() => setShowAvatar((v) => !v), 4000);
    return () => clearInterval(t);
  }, [both, big]);

  const start = () => {
    held.current = false;
    timer.current = setTimeout(() => { held.current = true; setBig(true); }, 350);
  };
  const end = () => {
    if (timer.current) clearTimeout(timer.current);
    if (held.current) setBig(false);
  };

  const img = (px: number) =>
    src ? (
      <img src={src} alt="" draggable={false} style={{ width: px, height: px }} className="rounded-full object-cover bg-muted" />
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
        {img(size)}
      </button>
      {big && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center pointer-events-none">
          <div className="rounded-full overflow-hidden shadow-2xl border-4 border-white/80" style={{ width: "min(78vw, 340px)", height: "min(78vw, 340px)" }}>
            {img(340)}
          </div>
        </div>
      )}
    </>
  );
}
