import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { checkPayment, hasPaymentServer, startBrowserPayment } from "@/lib/ads";
import VerifiedBadge, { markVerified } from "@/components/VerifiedBadge";

export default function Verify() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [has, setHas] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");
  const stop = useRef(false);
  const KEY = "pending-verify-link";
  useEffect(() => () => { stop.current = true; }, []);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((d) => setHas((d.data() as any)?.verified === true)).catch(() => setHas(false));
  }, [user?.uid]);

  if (!user) { setLocation("/login"); return null; }

  const grant = async () => {
    await setDoc(doc(db, "users", user.uid), { verified: true, verifiedAt: Date.now() }, { merge: true });
    markVerified(user.uid, true);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setHas(true);
  };

  // wait for the payment link to be paid (also resumes after the browser trip)
  const waitPaid = async (linkId: string) => {
    const until = Date.now() + 15 * 60 * 1000;
    while (Date.now() < until && !stop.current) {
      const r = await checkPayment(linkId).catch(() => null);
      if (r?.paid) { await grant(); return true; }
      if (r && (r.status === "expired" || r.status === "cancelled")) { try { localStorage.removeItem(KEY); } catch { /* ignore */ } throw new Error("The payment was cancelled or expired."); }
      await new Promise((res) => setTimeout(res, 3000));
    }
    return false;
  };

  useEffect(() => {
    let id: string | null = null;
    try { id = localStorage.getItem(KEY); } catch { /* ignore */ }
    if (!id || !user) return;
    setBusy(true); setStatus("Checking your payment…");
    waitPaid(id).catch((e) => setErr(e?.message || "")).finally(() => { setBusy(false); setStatus(""); });
  }, [user?.uid]);

  const claim = async () => {
    setBusy(true); setErr("");
    try {
      if (!hasPaymentServer) throw new Error("Payments are not set up yet. Please update the app.");
      setStatus("Opening payment…");
      const linkId = await startBrowserPayment(1, "Learn Islam green tick (lifetime)", user.email, user.displayName);
      try { localStorage.setItem(KEY, linkId); } catch { /* ignore */ }
      setStatus("Waiting for your ₹1 payment… finish it in the browser, then come back.");
      const ok = await waitPaid(linkId);
      if (!ok && !stop.current) setErr("Still waiting. If you already paid, come back to this page and the tick will be added.");
    } catch (e: any) { setErr(e?.message || "Could not start the payment. Try again."); }
    setBusy(false); setStatus("");
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
          <p className="flex justify-between text-lg"><span>Green tick, lifetime</span><span className="font-bold">₹1</span></p>
          <p className="text-sm text-foreground/60 mt-1">Pay ₹1 once with PhonePe, Google Pay or any UPI app. The tick is yours for life.</p>
          {has === true ? (
            <p className="mt-4 rounded-xl bg-green-600/15 text-green-600 font-semibold text-center py-3">You have the green tick ✓</p>
          ) : (
            <button onClick={claim} disabled={busy || has === null} className="mt-4 w-full rounded-xl bg-green-600 text-white font-semibold py-3 disabled:opacity-60">
              {busy ? "Please wait…" : "Get green tick for ₹1"}
            </button>
          )}
          {status && <p className="text-sm text-foreground/70 mt-3">{status}</p>}
          {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
        </div>
      </div>
    </div>
  );
}
