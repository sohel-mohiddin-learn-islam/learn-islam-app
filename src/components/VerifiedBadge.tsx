import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const cache = new Map<string, boolean>();
export const markVerified = (uid: string, v: boolean) => cache.set(uid, v);

/** Green verified tick. Shown for accounts that have claimed it on the "Get verified" page (free, lifetime). */
export default function VerifiedBadge({ uid, size = 16 }: { uid?: string; size?: number }) {
  const [on, setOn] = useState<boolean>(() => (uid ? cache.get(uid) === true : false));
  useEffect(() => {
    if (!uid) return;
    if (cache.has(uid)) { setOn(cache.get(uid) === true); return; }
    let live = true;
    getDoc(doc(db, "users", uid))
      .then((d) => { const v = (d.data() as any)?.verified === true; cache.set(uid, v); if (live) setOn(v); })
      .catch(() => {});
    return () => { live = false; };
  }, [uid]);
  if (!on) return null;
  return (
    <svg role="img" aria-label="Verified" viewBox="0 0 24 24" width={size} height={size} className="inline-block align-[-2px] ml-1 shrink-0">
      <path fill="#16a34a" d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3-1-3 2.6-1.9 1-3 3.2.1z" />
      <path d="M7.8 12.4l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
