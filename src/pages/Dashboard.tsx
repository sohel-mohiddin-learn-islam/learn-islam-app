import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { collection, getDocs, getDoc, doc, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { getUserPosts, postThumbnail } from "@/lib/posts";
import { compact, countOf } from "@/lib/analytics";
import { getFollowerIds } from "@/lib/social";

type Tab = "home" | "performance" | "audience";

const toMs = (v: any): number => (v?.toMillis ? v.toMillis() : typeof v === "number" ? v : 0);
const DAY = 86400000;

function ago(ms: number) {
  const d = Math.floor((Date.now() - ms) / DAY);
  if (d < 1) return `${Math.max(1, Math.floor((Date.now() - ms) / 3600000))}h`;
  if (d < 30) return `${d}d`;
  return new Date(ms).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
}

function Bar({ label, parts, total, max, colors }: { label: string; parts: number[]; total?: number; max: number; colors?: string[] }) {
  const cols = colors || ["bg-fuchsia-600", "bg-pink-400"];
  return (
    <div className="mb-4">
      <p className="mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden flex gap-0.5">
          {parts.map((p, i) => (
            <div key={i} className={cols[i % cols.length]} style={{ width: `${max ? (p / max) * 100 : 0}%` }} />
          ))}
        </div>
        <span className="w-14 text-right">{typeof total === "number" ? compact(total) : compact(parts.reduce((a, b) => a + b, 0))}</span>
      </div>
    </div>
  );
}

function Legend({ a = "Followers", b = "Non-followers" }: { a?: string; b?: string }) {
  return (
    <div className="flex gap-4 text-sm text-foreground/70 mb-3">
      <span><i className="inline-block w-2.5 h-2.5 rounded-full bg-fuchsia-600 mr-1.5" />{a}</span>
      <span><i className="inline-block w-2.5 h-2.5 rounded-full bg-pink-400 mr-1.5" />{b}</span>
    </div>
  );
}

type PostStat = {
  id: string; caption: string; thumb?: string; at: number;
  likes: number; comments: number; shares: number; saves: number; viewsF: number; viewsN: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("home");
  const [stats, setStats] = useState<PostStat[] | null>(null);
  const [storyViews, setStoryViews] = useState<[number, number]>([0, 0]);
  const [visits, setVisits] = useState(0);
  const [metric, setMetric] = useState<"all" | "likes" | "comments" | "shares" | "saves">("all");

  // audience
  const [range, setRange] = useState(30);
  const [followers, setFollowers] = useState<any[] | null>(null);
  const [followDocs, setFollowDocs] = useState<number[]>([]);
  const [events, setEvents] = useState<{ type: string; at: number }[]>([]);
  const [day, setDay] = useState(new Date().getDay());

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const posts = ((await getUserPosts(user.uid).catch(() => [])) as any[])
        .filter((p) => !p.archived)
        .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
        .slice(0, 40);

      const rows: PostStat[] = [];
      for (let i = 0; i < posts.length; i += 5) {
        const batch = await Promise.all(
          posts.slice(i, i + 5).map(async (p) => {
            const [likes, comments, shares, saves, vf, vn] = await Promise.all([
              countOf(["posts", p.id, "likes"]),
              countOf(["posts", p.id, "comments"]),
              countOf(["posts", p.id, "shares"]),
              countOf(["posts", p.id, "saves"]),
              countOf(["posts", p.id, "views"], where("isFollower", "==", true)),
              countOf(["posts", p.id, "views"], where("isFollower", "==", false)),
            ]);
            return {
              id: p.id, caption: p.caption || "", thumb: postThumbnail(p), at: toMs(p.createdAt),
              likes, comments, shares, saves, viewsF: vf, viewsN: vn,
            } as PostStat;
          })
        );
        rows.push(...batch);
      }
      if (active) setStats(rows);

      // stories (all, including expired ones)
      try {
        const sd = await getDocs(collection(db, "users", user.uid, "stories"));
        let f = 0, n = 0;
        for (const s of sd.docs) {
          f += await countOf(["users", user.uid, "stories", s.id, "views"], where("isFollower", "==", true));
          n += await countOf(["users", user.uid, "stories", s.id, "views"], where("isFollower", "==", false));
        }
        if (active) setStoryViews([f, n]);
      } catch { /* ignore */ }

      try {
        const vd = await getDocs(collection(db, "users", user.uid, "visits"));
        const cutoff = Date.now() - 30 * DAY;
        if (active) setVisits(vd.docs.filter((d) => toMs((d.data() as any).at) >= cutoff).length);
      } catch { /* ignore */ }

      // audience data
      try {
        const ids = await getFollowerIds(user.uid);
        const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id)).then((s) => (s.data() as any) || {}).catch(() => ({}))));
        if (active) setFollowers(docs);
      } catch {
        if (active) setFollowers([]);
      }
      try {
        const fdocs = await getDocs(query1(user.uid));
        if (active) setFollowDocs(fdocs.docs.map((d) => toMs((d.data() as any).createdAt)));
        const ev = await getDocs(collection(db, "users", user.uid, "followEvents"));
        if (active) setEvents(ev.docs.map((d) => ({ type: (d.data() as any).type, at: toMs((d.data() as any).at) })));
      } catch { /* ignore */ }
    })();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const totals = useMemo(() => {
    const s = stats || [];
    const sum = (k: keyof PostStat) => s.reduce((a, p) => a + (p[k] as number), 0);
    return {
      viewsF: sum("viewsF"), viewsN: sum("viewsN"),
      likes: sum("likes"), comments: sum("comments"), shares: sum("shares"), saves: sum("saves"),
    };
  }, [stats]);

  const TabBtn = ({ t, label }: { t: Tab; label: string }) => (
    <button
      onClick={() => setTab(t)}
      className={`flex-1 py-3 font-semibold ${tab === t ? "border-b-2 border-foreground text-foreground" : "text-foreground/50"}`}
    >
      {label}
    </button>
  );

  // ---------- audience maths ----------
  const aud = useMemo(() => {
    const f = followers || [];
    const cutoff = Date.now() - range * DAY;
    const follows = followDocs.filter((t) => t >= cutoff).length;
    const unfollows = events.filter((e) => e.type === "unfollow" && e.at >= cutoff).length;

    // followers per day: walk back from today using follows/unfollows
    const days: number[] = [];
    let current = f.length;
    const net = (from: number, to: number) =>
      followDocs.filter((t) => t >= from && t < to).length - events.filter((e) => e.type === "unfollow" && e.at >= from && e.at < to).length;
    const start = new Date().setHours(0, 0, 0, 0);
    for (let i = 0; i < range; i++) {
      days.unshift(current);
      current -= net(start - i * DAY, start - (i - 1) * DAY);
    }

    const pct = (values: string[]) => {
      const known = values.filter(Boolean);
      const m: Record<string, number> = {};
      known.forEach((v) => (m[v] = (m[v] || 0) + 1));
      return Object.entries(m)
        .map(([k, v]) => ({ k, v: (v / known.length) * 100 }))
        .sort((a, b) => b.v - a.v);
    };

    const slots = [0, 3, 6, 9, 12, 15, 18, 21];
    const act: Record<string, number> = {};
    f.forEach((d) => Object.entries(d.activity || {}).forEach(([k, v]) => (act[k] = (act[k] || 0) + (v as number))));
    const dayBars = slots.map((h) => act[`d${day}h${h}`] || 0);
    const best = Object.entries(act).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return {
      follows, unfollows, net: follows - unfollows, days, count: f.length,
      gender: pct(f.map((d) => d.gender)),
      age: ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((a) => ({
        k: a,
        v: (f.filter((d) => d.ageRange === a).length / Math.max(1, f.filter((d) => d.ageRange).length)) * 100,
      })),
      countries: pct(f.map((d) => d.country)).filter((x) => x.k !== "Unknown").slice(0, 5),
      cities: pct(f.map((d) => d.city)).filter((x) => x.k !== "Unknown").slice(0, 5),
      languages: pct(f.map((d) => d.language)).slice(0, 5),
      slots, dayBars, best,
    };
  }, [followers, followDocs, events, range, day]);

  const [place, setPlace] = useState<"countries" | "cities">("countries");
  const dowNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  const slotLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"} - ${(h + 3) % 12 === 0 ? 12 : (h + 3) % 12} ${(h + 3) % 24 < 12 ? "AM" : "PM"}`;

  const chart = () => {
    const d = aud.days;
    if (d.length < 2) return null;
    const min = Math.min(...d), max = Math.max(...d);
    const span = Math.max(1, max - min);
    const pts = d.map((v, i) => `${(i / (d.length - 1)) * 300},${90 - ((v - min) / span) * 80}`).join(" ");
    return (
      <svg viewBox="0 0 300 100" className="w-full h-40">
        <polyline points={pts} fill="none" stroke="#e040fb" strokeWidth="3" strokeLinejoin="round" />
        <text x="0" y="10" fontSize="8" fill="currentColor" opacity="0.6">{max}</text>
        <text x="0" y="98" fontSize="8" fill="currentColor" opacity="0.6">{min}</text>
      </svg>
    );
  };

  const interactionValue = (p: { likes: number; comments: number; shares: number; saves: number }) =>
    metric === "all" ? p.likes + p.comments + p.shares + p.saves : p[metric];

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-4 px-4 py-4">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold flex-1">Your dashboard</h1>
        </div>
        <div className="flex border-b border-border">
          <TabBtn t="home" label="Home" />
          <TabBtn t="performance" label="Performance" />
          <TabBtn t="audience" label="Audience" />
        </div>

        {tab === "home" && (
          <div className="px-4 pt-3">
            {stats === null && <p className="py-10 text-foreground/60">Loading…</p>}
            {stats && stats.length === 0 && <p className="py-10 text-foreground/60">Post a reel to see its numbers here.</p>}
            {stats?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3" onClick={() => setLocation("/reels")}>
                <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                  {p.thumb && <img src={p.thumb} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className="text-foreground/60 mr-2">{ago(p.at)}</span>
                    {p.caption}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    ❤️ {p.likes} &nbsp; 💬 {p.comments} &nbsp; 📤 {p.shares} &nbsp; 🔖 {p.saves}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{compact(p.viewsF + p.viewsN)}</p>
                  <p className="text-sm text-foreground/60">Views</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "performance" && (
          <div className="px-4 pt-4">
            <h2 className="font-semibold text-lg mb-2">Views by content type</h2>
            <Legend />
            {(() => {
              const max = Math.max(1, totals.viewsF + totals.viewsN, storyViews[0] + storyViews[1]);
              return (
                <>
                  <Bar label="Stories" parts={storyViews} max={max} />
                  <Bar label="Reels" parts={[totals.viewsF, totals.viewsN]} max={max} />
                </>
              );
            })()}
            <p className="text-xs text-foreground/50 mb-6">Views count each person once per reel or story.</p>

            <h2 className="font-semibold text-lg mb-2">Interactions by content type</h2>
            <div className="flex gap-2 overflow-x-auto mb-4">
              {(["all", "likes", "comments", "shares", "saves"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-4 py-2 rounded-full border whitespace-nowrap capitalize ${metric === m ? "bg-muted border-transparent" : "border-border"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <Bar label="Reels" parts={[interactionValue(totals)]} max={Math.max(1, interactionValue(totals))} colors={["bg-fuchsia-600"]} />

            <h2 className="font-semibold text-lg mt-6 mb-2">Profile activity</h2>
            <div className="flex items-center justify-between rounded-xl bg-muted p-4">
              <span>Profile visits (30 days)</span>
              <span className="font-bold text-xl">{visits}</span>
            </div>
          </div>
        )}

        {tab === "audience" && (
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">All content</h2>
              <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="bg-transparent text-foreground/70">
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                ["Followers", String(aud.count)],
                ["Net followers", `${aud.net >= 0 ? "+" : ""}${aud.net}`],
                ["Follows", `+${aud.follows}`],
                ["Unfollows", `-${aud.unfollows}`],
              ].map(([l, v]) => (
                <div key={l} className="min-w-[130px] rounded-2xl bg-muted p-4">
                  <p className="text-sm text-foreground/70">{l}</p>
                  <p className="text-2xl font-bold mt-1">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-fuchsia-500">{chart()}</div>

            <h2 className="font-semibold text-lg mt-6 mb-3">Gender</h2>
            {followers === null ? <p className="text-foreground/60">Loading…</p> : aud.gender.length === 0 ? (
              <p className="text-sm text-foreground/60">Not enough data yet. Followers can add this in Edit profile.</p>
            ) : aud.gender.map((g) => <Bar key={g.k} label={g.k} parts={[g.v]} total={undefined} max={100} colors={[g.k === "Women" ? "bg-fuchsia-600" : "bg-pink-400"]} />)}

            <h2 className="font-semibold text-lg mt-6 mb-3">Age range</h2>
            {aud.age.map((a) => (
              <div key={a.k} className="mb-3">
                <p className="mb-1">{a.k}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-pink-400" style={{ width: `${a.v}%` }} /></div>
                  <span className="w-14 text-right">{a.v.toFixed(1)}%</span>
                </div>
              </div>
            ))}

            <h2 className="font-semibold text-lg mt-6 mb-3">Top locations</h2>
            <div className="flex gap-2 mb-4">
              {(["countries", "cities"] as const).map((p) => (
                <button key={p} onClick={() => setPlace(p)} className={`px-4 py-2 rounded-full border capitalize ${place === p ? "bg-muted border-transparent" : "border-border"}`}>
                  {p}
                </button>
              ))}
            </div>
            {aud[place].length === 0 ? <p className="text-sm text-foreground/60">No data yet.</p> : aud[place].map((c) => (
              <div key={c.k} className="mb-3">
                <p className="mb-1">{c.k}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-fuchsia-600" style={{ width: `${c.v}%` }} /></div>
                  <span className="w-14 text-right">{c.v.toFixed(1)}%</span>
                </div>
              </div>
            ))}

            <h2 className="font-semibold text-lg mt-6 mb-3">Top languages</h2>
            {aud.languages.length === 0 ? <p className="text-sm text-foreground/60">No data yet.</p> : aud.languages.map((c) => (
              <div key={c.k} className="mb-3">
                <p className="mb-1">{c.k}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-fuchsia-600" style={{ width: `${c.v}%` }} /></div>
                  <span className="w-14 text-right">{c.v.toFixed(1)}%</span>
                </div>
              </div>
            ))}

            <h2 className="font-semibold text-lg mt-6">Follower active times</h2>
            <p className="text-sm text-foreground/60 mb-3">Based on your current time zone</p>
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {["Su", "M", "Tu", "W", "Th", "F", "Sa"].map((d, i) => (
                <button key={d} onClick={() => setDay(i)} className={`w-11 h-11 shrink-0 rounded-full border ${day === i ? "bg-muted border-transparent" : "border-border"}`}>
                  {d}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 h-44">
              {aud.dayBars.map((v, i) => {
                const m = Math.max(1, ...aud.dayBars);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full rounded-t-lg bg-fuchsia-600" style={{ height: `${Math.max(2, (v / m) * 100)}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 text-xs text-foreground/60 mt-1">
              {["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"].map((l) => <span key={l} className="flex-1 text-center">{l}</span>)}
            </div>

            <h2 className="font-semibold mt-6 mb-2">When followers are most active</h2>
            {aud.best.length === 0 ? <p className="text-sm text-foreground/60">Not enough activity yet.</p> : aud.best.map(([k]) => {
              const m = /d(\d)h(\d+)/.exec(k)!;
              return (
                <div key={k} className="mb-2">
                  <p className="font-semibold">{dowNames[Number(m[1])]}</p>
                  <p>{slotLabel(Number(m[2]))}</p>
                </div>
              );
            })}
            <p className="text-xs text-foreground/50 mt-6">
              Audience numbers come from followers' own profile details and the time zone and language of their phone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { query, collection as col } from "firebase/firestore";
function query1(uid: string) {
  return query(col(db, "follows"), where("followingId", "==", uid));
}
