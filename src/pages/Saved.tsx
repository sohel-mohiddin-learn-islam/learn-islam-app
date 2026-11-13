import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getPosts, postThumbnail } from "@/lib/posts";
import { createCollection, deleteCollection, listCollections, listSaved, unsavePostCloud, type Collection, type SavedEntry } from "@/lib/collections";
import { setSaveMarker } from "@/lib/analytics";
import CollectionSheet from "@/components/CollectionSheet";

export default function Saved() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [cols, setCols] = useState<Collection[]>([]);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [posts, setPosts] = useState<Map<string, any>>(new Map());
  const [open, setOpen] = useState<string | null>(null); // null = overview, "all" or a collection id
  const [sheet, setSheet] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    if (!user) return;
    try {
      const [c, s, p] = await Promise.all([listCollections(user.uid), listSaved(user.uid), getPosts()]);
      setCols(c); setSaved(s); setPosts(new Map((p as any[]).filter((x) => !x.archived).map((x) => [x.id, x])));
    } catch { /* show empty */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.uid]);

  const items = useMemo(() => saved.filter((e) => posts.has(e.postId)), [saved, posts]);
  if (!user) { setLocation("/login"); return null; }

  const inView = open === "all" ? items : items.filter((e) => open && e.collections.includes(open));
  const cover = (list: SavedEntry[]) => { const p = list.length ? posts.get(list[0].postId) : null; return p ? postThumbnail(p) : undefined; };
  const play = (id: string) => { try { sessionStorage.setItem("reel-start", id); } catch { /* ignore */ } setLocation("/reels"); };

  const Tile = ({ label, sub, img, onClick }: { label: string; sub?: string; img?: string; onClick: () => void }) => (
    <button onClick={onClick} className="text-left">
      <span className="block aspect-square rounded-2xl bg-muted overflow-hidden flex items-center justify-center text-3xl">
        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : "🔖"}
      </span>
      <span className="block font-semibold mt-1 truncate">{label}</span>
      {sub && <span className="block text-xs text-foreground/60">{sub}</span>}
    </button>
  );

  const current = open === "all" ? "All saved" : cols.find((c) => c.id === open)?.name;

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-background z-10">
          <button onClick={() => (open ? setOpen(null) : window.history.back())} className="text-2xl" aria-label="Back">←</button>
          <h1 className="flex-1 font-semibold text-lg truncate">{open ? current : "Saved"}</h1>
          {!open && <button onClick={() => setAdding(true)} className="text-2xl" aria-label="New collection">＋</button>}
          {open && open !== "all" && (
            <button onClick={async () => { if (confirm("Delete this collection? The posts stay saved.")) { await deleteCollection(user.uid, open, saved); setOpen(null); load(); } }} aria-label="Delete collection">🗑</button>
          )}
        </div>

        {adding && (
          <div className="flex gap-2 px-4 mb-3">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Collection name" className="flex-1 rounded-lg bg-muted px-3 py-2" />
            <button onClick={async () => { if (name.trim()) { await createCollection(user.uid, name); setName(""); setAdding(false); load(); } }} className="px-4 rounded-lg bg-primary text-primary-foreground font-semibold">Create</button>
            <button onClick={() => setAdding(false)} aria-label="Cancel">✕</button>
          </div>
        )}

        {loading && <p className="p-6 text-foreground/60">Loading…</p>}

        {!open && !loading && (
          <>
            <p className="px-4 text-sm text-foreground/60 mb-3">Only you can see what you save.</p>
            <div className="grid grid-cols-2 gap-4 px-4">
              <Tile label="All saved" sub={`${items.length} saved`} img={cover(items)} onClick={() => setOpen("all")} />
              {cols.map((c) => {
                const list = items.filter((e) => e.collections.includes(c.id));
                return <Tile key={c.id} label={c.name} sub={`${list.length} saved`} img={cover(list)} onClick={() => setOpen(c.id)} />;
              })}
            </div>
            {items.length === 0 && <p className="p-6 text-center text-foreground/60">Tap 🔖 on a reel to save it here.</p>}
          </>
        )}

        {open && (
          <>
            {inView.length === 0 && !loading && <p className="p-6 text-foreground/60">Nothing here yet.</p>}
            <div className="grid grid-cols-3 gap-0.5">
              {inView.map((e) => {
                const p = posts.get(e.postId);
                return (
                  <div key={e.postId} className="relative aspect-[9/16] bg-muted overflow-hidden">
                    <button onClick={() => play(e.postId)} className="absolute inset-0">
                      {postThumbnail(p) && <img src={postThumbnail(p)} alt="" loading="lazy" className="w-full h-full object-cover" />}
                    </button>
                    <button onClick={() => setSheet(e.postId)} aria-label="Collections" className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/55 text-white text-sm">📁</button>
                    <button
                      onClick={async () => { await unsavePostCloud(user.uid, e.postId); setSaveMarker(e.postId, user.uid, false); load(); }}
                      aria-label="Unsave" className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-black/55 text-white text-sm"
                    >🔖</button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {sheet && <CollectionSheet postId={sheet} onClose={() => { setSheet(""); load(); }} onUnsaved={load} />}
    </div>
  );
}
