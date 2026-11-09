import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFollowerIds, getFollowingIds, getProfile } from "@/lib/social";
import { createGroup, MAX_GROUP } from "@/lib/groups";

type P = { uid: string; name: string; photo: string | null };

export default function NewGroup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [people, setPeople] = useState<P[]>([]);
  const [picked, setPicked] = useState<string[]>(() => {
    const w = new URLSearchParams(window.location.search).get("with");
    return w ? [w] : [];
  });
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ids = Array.from(new Set([...(await getFollowingIds(user.uid).catch(() => [])), ...(await getFollowerIds(user.uid).catch(() => [])), ...picked]));
      const list = await Promise.all(ids.slice(0, 100).map((id) => getProfile(id).then((p) => ({ uid: id, name: p.displayName, photo: p.photoURL })).catch(() => null)));
      setPeople(list.filter(Boolean) as P[]);
    })();
  }, [user?.uid]);

  const shown = useMemo(() => people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [people, q]);
  if (!user) { setLocation("/login"); return null; }

  const create = async () => {
    if (!picked.length) return setErr("Pick at least one person.");
    setBusy(true); setErr("");
    try {
      const id = await createGroup(user.uid, name || people.filter((p) => picked.includes(p.uid)).map((p) => p.name.split(" ")[0]).slice(0, 3).join(", "), picked, null);
      setLocation(`/group/${id}`);
    } catch (e: any) {
      setErr(e?.message || "Could not create the group.");
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-sans">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => window.history.back()} aria-label="Back"><ArrowLeft /></button>
        <h1 className="font-semibold text-lg flex-1">New group</h1>
        <button onClick={create} disabled={busy || !picked.length} className="text-primary font-semibold disabled:opacity-40">Create</button>
      </div>
      <div className="p-4 space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Group name" className="w-full bg-muted rounded-xl px-4 py-3 outline-none" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="w-full bg-muted rounded-xl px-4 py-3 outline-none" />
        <p className="text-sm text-foreground/60">{picked.length} selected · up to {MAX_GROUP - 1} people</p>
        {err && <p className="text-sm text-red-500">{err}</p>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {shown.length === 0 && <p className="p-6 text-foreground/60">Follow people to add them to a group.</p>}
        {shown.map((p) => {
          const on = picked.includes(p.uid);
          return (
            <button key={p.uid} onClick={() => setPicked((a) => (on ? a.filter((x) => x !== p.uid) : a.length < MAX_GROUP - 1 ? [...a, p.uid] : a))} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left">
              <span className="w-11 h-11 rounded-full bg-muted overflow-hidden flex items-center justify-center">{p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : "👤"}</span>
              <span className="flex-1 font-semibold truncate">{p.name}</span>
              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${on ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>{on && <Check className="w-4 h-4" />}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
