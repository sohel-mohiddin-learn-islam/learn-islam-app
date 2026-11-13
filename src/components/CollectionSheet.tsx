import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPosts, postThumbnail } from "@/lib/posts";
import { createCollection, listCollections, listSaved, setPostCollections, unsavePostCloud, type Collection, type SavedEntry } from "@/lib/collections";

/** "Add to collection" bottom sheet (like Instagram). "Saved" is always on while the sheet is open; unticking it unsaves. */
export default function CollectionSheet({ postId, onClose, onUnsaved }: { postId: string; onClose: () => void; onUnsaved?: () => void }) {
  const { user } = useAuth();
  const [cols, setCols] = useState<Collection[] | null>(null);
  const [mine, setMine] = useState<string[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [c, s, posts] = await Promise.all([listCollections(user.uid), listSaved(user.uid), getPosts().catch(() => [] as any[])]);
        setCols(c);
        setMine(s.find((x: SavedEntry) => x.postId === postId)?.collections || []);
        const byId = new Map((posts as any[]).map((p) => [p.id, p]));
        const t: Record<string, string> = {};
        c.forEach((col) => {
          const e = s.find((x) => x.collections.includes(col.id));
          const p = e && byId.get(e.postId);
          if (p && postThumbnail(p)) t[col.id] = postThumbnail(p)!;
        });
        setThumbs(t);
      } catch { setCols([]); setErr("Could not load collections."); }
    })();
  }, [user?.uid, postId]);

  if (!user) return null;
  const uid = user.uid;

  const toggle = async (id: string) => {
    const next = mine.includes(id) ? mine.filter((x) => x !== id) : [...mine, id];
    setMine(next);
    setSaved(true);
    await setPostCollections(uid, postId, next).catch(() => setErr("Could not save. Try again."));
  };
  const create = async () => {
    if (!name.trim()) return;
    try {
      const c = await createCollection(uid, name);
      setCols((l) => [c, ...(l || [])]);
      setName(""); setAdding(false);
      await toggle(c.id);
    } catch { setErr("Could not create the collection."); }
  };
  const toggleSavedAll = async () => {
    if (saved) { setSaved(false); await unsavePostCloud(uid, postId); onUnsaved?.(); onClose(); }
  };

  const Tick = ({ on }: { on: boolean }) => (
    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${on ? "bg-foreground text-background border-foreground" : "border-foreground/50"}`}>{on ? "✓" : ""}</span>
  );

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full max-h-[80%] overflow-y-auto bg-background text-foreground rounded-t-3xl p-5 font-sans" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-foreground/30 mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Add to collection</h2>
          <button onClick={() => setAdding((v) => !v)} className="text-sky-500 font-semibold">New collection</button>
        </div>
        {adding && (
          <div className="flex gap-2 mb-4">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Collection name" className="flex-1 rounded-lg bg-muted px-3 py-2" />
            <button onClick={create} className="px-4 rounded-lg bg-primary text-primary-foreground font-semibold">Create</button>
          </div>
        )}
        <button onClick={toggleSavedAll} className="w-full flex items-center gap-4 py-2 text-left">
          <span className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">🔖</span>
          <span className="flex-1"><span className="block font-semibold">Saved</span><span className="block text-sm text-foreground/60">Private</span></span>
          <Tick on={saved} />
        </button>
        {cols === null && <p className="text-foreground/60 py-4">Loading…</p>}
        {cols?.map((c) => (
          <button key={c.id} onClick={() => toggle(c.id)} className="w-full flex items-center gap-4 py-2 text-left">
            <span className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center text-2xl">
              {thumbs[c.id] ? <img src={thumbs[c.id]} alt="" className="w-full h-full object-cover" /> : "📁"}
            </span>
            <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{c.name}</span><span className="block text-sm text-foreground/60">Private</span></span>
            <Tick on={mine.includes(c.id)} />
          </button>
        ))}
        {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
        <button onClick={onClose} className="w-full mt-4 py-3 rounded-xl bg-muted font-semibold">Done</button>
      </div>
    </div>
  );
}
