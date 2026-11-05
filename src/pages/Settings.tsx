import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getPosts, postThumbnail, setArchived, deletePost } from "@/lib/posts";
import { addUsage, likedReelIds, setPrefs, todayUsage, toggleSaved, usePrefs } from "@/lib/prefs";
import {
  getProfile,
  getRelations,
  setPrivate,
  unblockUser,
  unmuteUser,
  type UserProfile,
} from "@/lib/social";

type View =
  | "main" | "privacy" | "saved" | "archive" | "activity" | "time"
  | "blocked" | "muted" | "accessibility" | "data" | "invite" | "about";

const APP_LINK = "https://github.com/sohel-mohiddin-learn-islam/learn-islam-app/releases/download/apk-latest/learn-islam.apk";

function Row({ icon, label, value, onClick }: { icon: string; label: string; value?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted text-left">
      <span className="text-2xl w-8 text-center">{icon}</span>
      <span className="flex-1 text-foreground">{label}</span>
      {value && <span className="text-foreground/60 text-sm">{value}</span>}
      <span className="text-foreground/40">›</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-2 mb-2">
      <p className="px-4 pt-3 pb-1 text-sm text-foreground/60">{title}</p>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-12 h-7 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-muted border border-border"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function PeopleManage({ field, action }: { field: "blocked" | "muted"; action: string }) {
  const { user } = useAuth();
  const [people, setPeople] = useState<UserProfile[] | null>(null);

  useEffect(() => {
    if (!user) return;
    getRelations(user.uid)
      .then((r) => Promise.all(r[field].map((id) => getProfile(id))))
      .then(setPeople)
      .catch(() => setPeople([]));
  }, [user?.uid]);

  if (people === null) return <p className="p-6 text-foreground/60">Loading…</p>;
  if (people.length === 0) return <p className="p-6 text-foreground/60">Nobody here.</p>;

  return (
    <div>
      {people.map((p) => (
        <div key={p.uid} className="flex items-center gap-3 px-4 py-3">
          <span className="flex-1">{p.displayName}</span>
          <button
            onClick={async () => {
              if (!user) return;
              await (field === "blocked" ? unblockUser : unmuteUser)(user.uid, p.uid).catch(() => {});
              setPeople((l) => (l || []).filter((x) => x.uid !== p.uid));
            }}
            className="px-3 py-1 rounded-lg bg-muted text-sm font-semibold"
          >
            {action}
          </button>
        </div>
      ))}
    </div>
  );
}

function PostGrid({
  load,
  actions,
}: {
  load: () => Promise<any[]>;
  actions: (post: any, refresh: () => void) => React.ReactNode;
}) {
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<any[] | null>(null);
  const refresh = () => load().then(setPosts).catch(() => setPosts([]));
  useEffect(() => {
    refresh();
  }, []);

  if (posts === null) return <p className="p-6 text-foreground/60">Loading…</p>;
  if (posts.length === 0) return <p className="p-6 text-foreground/60">Nothing here yet.</p>;
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((p) => {
        const t = postThumbnail(p);
        return (
          <div key={p.id} className="relative aspect-[9/16] bg-muted overflow-hidden" onClick={() => setLocation("/reels")}>
            {t && <img src={t} alt="" loading="lazy" className="w-full h-full object-cover" />}
            <div className="absolute bottom-1 right-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
              {actions(p, refresh)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const chip = "bg-black/65 text-white rounded-full px-2 py-1 text-xs";

export default function Settings() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const prefs = usePrefs();
  const [view, setView] = useState<View>("main");
  const [isPrivate, setIsPriv] = useState(false);
  const [counts, setCounts] = useState({ blocked: 0, muted: 0 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    getRelations(user.uid)
      .then((r) => {
        setIsPriv(r.isPrivate);
        setCounts({ blocked: r.blocked.length, muted: r.muted.length });
      })
      .catch(() => {});
  }, [user?.uid, view]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const titles: Record<View, string> = {
    main: "Settings and activity",
    privacy: "Account privacy",
    saved: "Saved",
    archive: "Archive",
    activity: "Your activity",
    time: "Time management",
    blocked: "Blocked",
    muted: "Muted accounts",
    accessibility: "Accessibility",
    data: "Data usage and media quality",
    invite: "Follow and invite friends",
    about: "About",
  };

  const back = () => (view === "main" ? window.history.back() : setView("main"));
  const used = Math.floor(todayUsage() / 60);

  const body = () => {
    switch (view) {
      case "privacy":
        return (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold">Private account</p>
                <p className="text-sm text-foreground/60">
                  When your account is private, only people who follow you can see your reels.
                </p>
              </div>
              <Toggle
                on={isPrivate}
                onChange={async (v) => {
                  setIsPriv(v);
                  await setPrivate(user.uid, v).catch(() => {
                    setIsPriv(!v);
                    setMsg("Could not change privacy. Please try again.");
                  });
                }}
              />
            </div>
            {msg && <p className="text-sm text-red-400 mt-3">{msg}</p>}
          </div>
        );

      case "saved":
        return (
          <PostGrid
            load={async () => (await getPosts()).filter((p: any) => prefs.saved.includes(p.id) && !p.archived)}
            actions={(p, refresh) => (
              <button
                className={chip}
                onClick={() => {
                  toggleSaved(p.id);
                  setTimeout(refresh, 0);
                }}
              >
                Unsave
              </button>
            )}
          />
        );

      case "archive":
        return (
          <PostGrid
            load={async () => (await getPosts()).filter((p: any) => p.userId === user.uid && p.archived)}
            actions={(p, refresh) => (
              <>
                <button className={chip} onClick={async () => { await setArchived(p.id, false); refresh(); }}>
                  Restore
                </button>
                <button
                  className={chip}
                  onClick={async () => {
                    if (confirm("Delete this reel? This cannot be undone.")) {
                      await deletePost(p.id, user.uid, p.videoUrl);
                      refresh();
                    }
                  }}
                >
                  🗑
                </button>
              </>
            )}
          />
        );

      case "activity": {
        const liked = likedReelIds();
        return (
          <div>
            <Section title="Today">
              <p className="px-4 py-2">{used} min in the app</p>
            </Section>
            <Section title="Interactions">
              <p className="px-4 py-2">{liked.length} reels liked on this device</p>
              <p className="px-4 py-2">{prefs.saved.length} reels saved</p>
            </Section>
            <Row icon="📑" label="Saved" onClick={() => setView("saved")} />
            <Row icon="🗂" label="Archive" onClick={() => setView("archive")} />
          </div>
        );
      }

      case "time":
        return (
          <div className="p-4 space-y-4">
            <p>Time in the app today: <b>{used} min</b></p>
            <div>
              <p className="font-semibold mb-2">Daily reminder</p>
              <div className="flex flex-wrap gap-2">
                {[0, 15, 30, 60, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPrefs({ dailyLimit: m })}
                    className={`px-4 py-2 rounded-lg ${prefs.dailyLimit === m ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {m === 0 ? "Off" : m < 60 ? `${m} min` : `${m / 60} h`}
                  </button>
                ))}
              </div>
              <p className="text-sm text-foreground/60 mt-2">You will get a reminder once you reach the limit each day.</p>
            </div>
          </div>
        );

      case "blocked":
        return <PeopleManage field="blocked" action="Unblock" />;
      case "muted":
        return <PeopleManage field="muted" action="Unmute" />;

      case "accessibility":
        return (
          <div className="p-4">
            <p className="font-semibold mb-2">Text size</p>
            <div className="flex flex-wrap gap-2">
              {[["Small", 0.9], ["Normal", 1], ["Large", 1.15], ["Extra large", 1.3]].map(([l, v]) => (
                <button
                  key={l as string}
                  onClick={() => setPrefs({ textScale: v as number })}
                  className={`px-4 py-2 rounded-lg ${prefs.textScale === v ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        );

      case "data":
        return (
          <div className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold">Use less data</p>
              <p className="text-sm text-foreground/60">Plays reels in a lower quality (480p) to save mobile data.</p>
            </div>
            <Toggle on={prefs.dataSaver} onChange={(v) => setPrefs({ dataSaver: v })} />
          </div>
        );

      case "invite":
        return (
          <div className="p-4 space-y-3">
            <p>Invite friends to Learn Islam by sharing the app link.</p>
            <button
              onClick={async () => {
                try {
                  if (navigator.share) await navigator.share({ title: "Learn Islam", text: "Install the Learn Islam app", url: APP_LINK });
                  else {
                    await navigator.clipboard.writeText(APP_LINK);
                    setMsg("Link copied.");
                  }
                } catch {
                  /* cancelled */
                }
              }}
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 font-semibold"
            >
              Share app link
            </button>
            {msg && <p className="text-sm text-foreground/70">{msg}</p>}
          </div>
        );

      default:
        return (
          <div>
            <Section title="Your account">
              <Row icon="👤" label="Edit profile" onClick={() => setLocation("/account")} />
            </Section>
            <Section title="How you use Learn Islam">
              <Row icon="📑" label="Saved" value={prefs.saved.length ? String(prefs.saved.length) : ""} onClick={() => setView("saved")} />
              <Row icon="🗂" label="Archive" onClick={() => setView("archive")} />
              <Row icon="📈" label="Your activity" onClick={() => setView("activity")} />
              <Row icon="⏱" label="Time management" value={prefs.dailyLimit ? `${prefs.dailyLimit} min` : "Off"} onClick={() => setView("time")} />
            </Section>
            <Section title="Who can see your content">
              <Row icon="🔒" label="Account privacy" value={isPrivate ? "Private" : "Public"} onClick={() => setView("privacy")} />
              <Row icon="🚫" label="Blocked" value={String(counts.blocked)} onClick={() => setView("blocked")} />
            </Section>
            <Section title="What you see">
              <Row icon="🔕" label="Muted accounts" value={String(counts.muted)} onClick={() => setView("muted")} />
              <Row icon="➕" label="Follow and invite friends" onClick={() => setView("invite")} />
            </Section>
            <Section title="Your app and media">
              <Row icon="♿" label="Accessibility" onClick={() => setView("accessibility")} />
              <Row icon="📶" label="Data usage and media quality" value={prefs.dataSaver ? "Low" : "Normal"} onClick={() => setView("data")} />
            </Section>
            <Section title="More info and support">
              <Row icon="🛟" label="Help" onClick={() => setLocation("/contact")} />
              <Row icon="🛡" label="Privacy Center" onClick={() => setLocation("/terms")} />
              <Row icon="ℹ️" label="About" onClick={() => setLocation("/about")} />
            </Section>
            <Section title="Login">
              <button
                onClick={async () => {
                  if (confirm("Log out of your account?")) {
                    await signOut();
                    setLocation("/");
                  }
                }}
                className="w-full text-left px-4 py-3.5 text-red-400 font-semibold"
              >
                Log out
              </button>
            </Section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-4 px-4 py-4 sticky top-0 bg-background z-10">
          <button onClick={back} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">{titles[view]}</h1>
        </div>
        {body()}
      </div>
    </div>
  );
}

/** Counts the seconds the app is open each day and shows a reminder when the daily limit is reached. */
export function UsageTracker() {
  const prefs = usePrefs();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      addUsage(10);
      const dismissed = localStorage.getItem(`li-limit-dismissed-${new Date().toISOString().slice(0, 10)}`);
      if (prefs.dailyLimit > 0 && todayUsage() >= prefs.dailyLimit * 60 && !dismissed) setShow(true);
    }, 10000);
    return () => clearInterval(id);
  }, [prefs.dailyLimit]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-6">
      <div className="bg-background rounded-2xl p-6 max-w-sm text-center font-sans">
        <p className="text-4xl mb-2">⏱</p>
        <p className="font-semibold text-lg mb-1">Daily limit reached</p>
        <p className="text-foreground/70 mb-4">You have spent {prefs.dailyLimit} minutes in the app today. Take a break and make dua. 🤲</p>
        <button
          onClick={() => {
            localStorage.setItem(`li-limit-dismissed-${new Date().toISOString().slice(0, 10)}`, "1");
            setShow(false);
          }}
          className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
}
