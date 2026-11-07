import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getPosts, postThumbnail } from "@/lib/posts";
import { getFollowingIds } from "@/lib/social";

type Person = { uid: string; name: string; photo: string | null; bio: string };
type Tab = "people" | "reels";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const title = (s: string) => s.split(" ").map(cap).join(" ");

async function findPeople(q: string): Promise<Person[]> {
  const t = q.trim();
  if (!t) return [];
  // names are stored as typed, so try a few common spellings of the same text
  const variants = Array.from(new Set([t, t.toLowerCase(), cap(t), title(t.toLowerCase()), t.toUpperCase()]));
  const out = new Map<string, Person>();
  await Promise.all(
    variants.map(async (v) => {
      const snap = await getDocs(query(collection(db, "users"), where("displayName", ">=", v), where("displayName", "<=", v + ""), limit(15))).catch(() => null);
      snap?.docs.forEach((d) => {
        const x: any = d.data();
        out.set(d.id, { uid: d.id, name: x.displayName || "User", photo: x.photoURL || null, bio: x.bio || "" });
      });
    })
  );
  return Array.from(out.values()).slice(0, 30);
}

export default function Search() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [q, setQ] = useState(() => {
    try { const v = sessionStorage.getItem("search-q") || ""; sessionStorage.removeItem("search-q"); return v; } catch { return ""; }
  });
  const [tab, setTab] = useState<Tab>(() => (q.startsWith("#") ? "reels" : "people"));
  const [people, setPeople] = useState<Person[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [allPosts, setAllPosts] = useState<any[] | null>(null);
  const [priv, setPriv] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    getPosts().then((p) => setAllPosts(p as any[])).catch(() => setAllPosts([]));
    if (user) getFollowingIds(user.uid).then(setFollowing).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) { setPeople([]); setReels([]); return; }
      setBusy(true);
      if (!term.startsWith("#")) setPeople(await findPeople(term));
      else setPeople([]);

      const needle = term.toLowerCase();
      const hits = (allPosts || []).filter((p: any) => !p.archived && typeof p.caption === "string" && p.caption.toLowerCase().includes(needle)).slice(0, 60);
      // reels of private accounts are only for their followers
      const owners = Array.from(new Set(hits.map((p: any) => p.userId))) as string[];
      const privs: string[] = [];
      await Promise.all(owners.map(async (id) => {
        try { if (((await getDoc(doc(db, "users", id))).data() as any)?.isPrivate) privs.push(id); } catch { /* ignore */ }
      }));
      setPriv(privs);
      setReels(hits);
      setBusy(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q, allPosts]);

  const visibleReels = reels.filter((p) => !priv.includes(p.userId) || p.userId === user?.uid || following.includes(p.userId));

  const tabBtn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)} className={`flex-1 py-3 font-semibold ${tab === t ? "border-b-2 border-primary text-primary" : "text-foreground/60"}`}>{label}</button>
  );

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-background z-10">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <div className="flex-1 flex items-center gap-2 rounded-full bg-muted px-4 py-2.5">
            <span>🔍</span>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, captions or #hashtags" className="flex-1 bg-transparent outline-none" />
            {q && <button onClick={() => setQ("")} aria-label="Clear">✕</button>}
          </div>
        </div>

        <div className="flex border-b border-border">{tabBtn("people", "People")}{tabBtn("reels", "Reels")}</div>

        {!q.trim() && <p className="p-6 text-foreground/60">Type a name to find someone, or a word or #hashtag to find reels.</p>}
        {busy && <p className="px-6 py-3 text-foreground/50 text-sm">Searching…</p>}

        {tab === "people" && q.trim() && !busy && people.length === 0 && (
          <p className="p-6 text-foreground/60">{q.startsWith("#") ? "Hashtags show up under Reels." : "No people found. Check the spelling of the name."}</p>
        )}
        {tab === "people" && people.map((p) => (
          <button key={p.uid} onClick={() => setLocation(p.uid === user?.uid ? "/account" : `/user/${p.uid}`)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left">
            <span className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
              {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : "👤"}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold truncate">{p.name}</span>
              {p.bio && <span className="block text-sm text-foreground/60 truncate">{p.bio}</span>}
            </span>
          </button>
        ))}

        {tab === "reels" && q.trim() && !busy && visibleReels.length === 0 && <p className="p-6 text-foreground/60">No reels found.</p>}
        {tab === "reels" && (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {visibleReels.map((p) => (
              <button key={p.id} onClick={() => { try { sessionStorage.setItem("reel-start", p.id); } catch { /* ignore */ } setLocation("/reels"); }} className="relative aspect-[9/16] bg-muted overflow-hidden">
                {postThumbnail(p) && <img src={postThumbnail(p)} alt="" loading="lazy" className="w-full h-full object-cover" />}
                <span className="absolute bottom-1 left-1 right-1 text-[11px] text-white drop-shadow line-clamp-2 text-left">{p.caption}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
