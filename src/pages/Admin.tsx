import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { collection, deleteField, doc, getDoc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/ads";
import VerifiedBadge, { markVerified } from "@/components/VerifiedBadge";

type U = { uid: string; name: string; photo: string | null; verified: boolean };
const toU = (id: string, x: any): U => ({ uid: id, name: x.displayName || "User", photo: x.photoURL || null, verified: x.verified === true });

/** Admin only: give or remove the green tick for free. Firestore rules let only the admin's verified email do this. */
export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<U[]>([]);
  const [ticked, setTicked] = useState<U[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  const loadTicked = async () => {
    try {
      const snap = await getDocs(query(collection(db, "users"), where("verified", "==", true), limit(100)));
      setTicked(snap.docs.map((d) => toU(d.id, d.data())));
    } catch { /* ignore */ }
  };
  useEffect(() => { if (isAdmin) loadTicked(); }, [isAdmin]);

  useEffect(() => {
    const t = q.trim();
    if (!isAdmin || !t) { setResults([]); return; }
    const h = window.setTimeout(async () => {
      try {
        // a pasted user id / profile link opens that account directly
        const id = /([A-Za-z0-9]{20,40})\/?$/.exec(t)?.[1];
        const out = new Map<string, U>();
        if (id) { const d = await getDoc(doc(db, "users", id)); if (d.exists()) out.set(id, toU(id, d.data())); }
        // names are matched from the start, as typed and with a capital first letter
        for (const v of Array.from(new Set([t, t[0].toUpperCase() + t.slice(1), t.toLowerCase()]))) {
          const snap = await getDocs(query(collection(db, "users"), where("displayName", ">=", v), where("displayName", "<=", v + ""), limit(15)));
          snap.docs.forEach((d) => out.set(d.id, toU(d.id, d.data())));
        }
        setResults(Array.from(out.values()));
      } catch { setResults([]); }
    }, 350);
    return () => window.clearTimeout(h);
  }, [q, isAdmin]);

  const setTick = async (u: U, on: boolean) => {
    setBusy(u.uid); setMsg("");
    try {
      await updateDoc(doc(db, "users", u.uid), on ? { verified: true, verifiedAt: Date.now() } : { verified: false, verifiedAt: deleteField() });
      markVerified(u.uid, on);
      setResults((r) => r.map((x) => (x.uid === u.uid ? { ...x, verified: on } : x)));
      setMsg(on ? `Green tick given to ${u.name}.` : `Green tick removed from ${u.name}.`);
      loadTicked();
    } catch (e: any) {
      setMsg("Could not change it. Publish the latest Firestore rules first. " + (e?.code || ""));
    }
    setBusy("");
  };

  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-foreground/60">This page is only for the admin.</div>;

  const Row = ({ u }: { u: U }) => (
    <div className="flex items-center gap-3 py-2">
      <span className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">{u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> : "👤"}</span>
      <span className="flex-1 min-w-0"><span className="block truncate font-medium">{u.name}<VerifiedBadge uid={u.verified ? u.uid : undefined} size={14} /></span><span className="block text-[10px] text-foreground/40 truncate">{u.uid}</span></span>
      <button disabled={busy === u.uid} onClick={() => setTick(u, !u.verified)} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${u.verified ? "bg-red-500/15 text-red-500" : "bg-primary text-primary-foreground"}`}>
        {busy === u.uid ? "…" : u.verified ? "Remove tick" : "Give tick"}
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-4 pb-12 text-foreground">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
        <h1 className="text-xl font-bold">Admin · Green ticks</h1>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name, or paste a user ID / profile link" className="w-full bg-muted rounded-full px-4 py-2.5 outline-none mb-2" />
      {msg && <p className="text-sm mb-2 text-primary">{msg}</p>}
      <div className="divide-y divide-border">{results.map((u) => <Row key={u.uid} u={u} />)}</div>
      {q.trim() && !results.length && <p className="text-sm text-foreground/50 py-3">No accounts found. Names match from the first letters.</p>}
      <h2 className="font-bold mt-6 mb-1">Accounts with a green tick ({ticked.length})</h2>
      <div className="divide-y divide-border">{ticked.map((u) => <Row key={u.uid} u={{ ...u, verified: true }} />)}</div>
    </div>
  );
}
