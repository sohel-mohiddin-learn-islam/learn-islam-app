import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import VerifiedBadge, { markVerified } from "@/components/VerifiedBadge";

export default function Verify() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [has, setHas] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((d) => setHas((d.data() as any)?.verified === true)).catch(() => setHas(false));
  }, [user?.uid]);

  if (!user) { setLocation("/login"); return null; }

  const claim = async () => {
    setBusy(true); setErr("");
    try {
      await setDoc(doc(db, "users", user.uid), { verified: true, verifiedAt: Date.now() }, { merge: true });
      markVerified(user.uid, true);
      setHas(true);
    } catch { setErr("Could not get the tick. Check your internet and try again."); }
    setBusy(false);
  };

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto px-5 py-6">
        <button onClick={() => window.history.back()} className="text-2xl mb-4" aria-label="Back">←</button>
        <div className="text-center">
          <svg viewBox="0 0 24 24" width="96" height="96" className="mx-auto">
            <path fill="#16a34a" d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3-1-3 2.6-1.9 1-3 3.2.1z" />
            <path d="M7.8 12.4l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="text-2xl font-bold mt-4">Green tick</h1>
          <p className="text-foreground/70 mt-2">Show a green tick <VerifiedBadge uid={has ? user.uid : undefined} /> next to your name on your profile, reels, comments and chats.</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border p-5">
          <p className="flex justify-between text-lg"><span>Green tick, lifetime</span><span className="font-bold">₹0</span></p>
          <p className="text-sm text-foreground/60 mt-1">No payment needed. One time, for life.</p>
          {has === true ? (
            <p className="mt-4 rounded-xl bg-green-600/15 text-green-600 font-semibold text-center py-3">You have the green tick ✓</p>
          ) : (
            <button onClick={claim} disabled={busy || has === null} className="mt-4 w-full rounded-xl bg-green-600 text-white font-semibold py-3 disabled:opacity-60">
              {busy ? "Please wait…" : "Get green tick for ₹0"}
            </button>
          )}
          {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
        </div>
      </div>
    </div>
  );
}
