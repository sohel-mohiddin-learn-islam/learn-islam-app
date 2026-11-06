import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { clearAll, markAllRead, watchNotifications, type Notif } from "@/lib/notifications";
import { follow, getProfile, isFollowing, type UserProfile } from "@/lib/social";
import { containsHiddenWord } from "@/lib/prefs";
import { notify } from "@/lib/notifications";

function ago(ms: number) {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function dayBucket(ms: number) {
  const startToday = new Date().setHours(0, 0, 0, 0);
  if (ms >= startToday) return "Today";
  if (ms >= startToday - 86400000) return "Yesterday";
  if (ms >= startToday - 7 * 86400000) return "This week";
  return "Earlier";
}

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<Notif[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    return watchNotifications(
      user.uid,
      (list) => setItems(list),
      (e) => {
        console.error(e);
        setItems([]);
        setError("Could not load notifications.");
      }
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !items) return;
    // opening the page marks everything as read
    markAllRead(user.uid, items);
    items.forEach((n) => {
      if (!profiles[n.fromId]) getProfile(n.fromId).then((p) => setProfiles((m) => ({ ...m, [n.fromId]: p })));
      if (n.type === "follow" && following[n.fromId] === undefined) {
        isFollowing(user.uid, n.fromId).then((v) => setFollowing((m) => ({ ...m, [n.fromId]: v })));
      }
    });
  }, [items?.length]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const sentence = (n: Notif) => {
    if (n.type === "follow") return "started following you.";
    if (n.type === "request") return "requested to follow you.";
    if (n.type === "like") return "liked your reel.";
    return containsHiddenWord(n.text || "") ? "commented (hidden by your Hidden Words)." : `commented: ${n.text}`;
  };

  const groups: Record<string, Notif[]> = {};
  (items || []).forEach((n) => (groups[dayBucket(n.createdAt)] ||= []).push(n));

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-4 px-4 py-4 sticky top-0 bg-background z-10">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold flex-1">Notifications</h1>
          {items && items.length > 0 && (
            <button
              onClick={() => confirm("Clear all notifications?") && clearAll(user.uid)}
              className="text-sm text-primary"
            >
              Clear all
            </button>
          )}
        </div>

        {items === null && <p className="p-6 text-foreground/60">Loading…</p>}
        {items && items.length === 0 && (
          <p className="p-6 text-foreground/60">{error || "No notifications yet. Likes, comments and new followers will show up here."}</p>
        )}

        {["Today", "Yesterday", "This week", "Earlier"].map(
          (label) =>
            groups[label] && (
              <div key={label}>
                <p className="px-4 pt-5 pb-1 font-semibold text-lg">{label}</p>
                {groups[label].map((n) => {
                  const p = profiles[n.fromId];
                  return (
                    <div
                      key={n.id}
                      onClick={() => setLocation(n.type === "request" ? "/follow-requests" : n.type === "follow" ? `/user/${n.fromId}` : "/reels")}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted ${n.read ? "" : "bg-primary/5"}`}
                    >
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/user/${n.fromId}`);
                        }}
                        className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0"
                      >
                        {p?.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
                      </span>
                      <span className="flex-1 min-w-0 text-sm">
                        <b>{p?.displayName || "Someone"}</b> {sentence(n)} <span className="text-foreground/50">{ago(n.createdAt)}</span>
                      </span>
                      {n.type === "follow" && following[n.fromId] === false && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setFollowing((m) => ({ ...m, [n.fromId]: true }));
                            await follow(user.uid, n.fromId).catch(() => setFollowing((m) => ({ ...m, [n.fromId]: false })));
                            notify(n.fromId, user.uid, "follow");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                        >
                          Follow back
                        </button>
                      )}
                      {n.type === "follow" && following[n.fromId] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/chat/${n.fromId}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-muted text-sm font-semibold"
                        >
                          Message
                        </button>
                      )}
                      {n.type !== "follow" && n.thumb && (
                        <img src={n.thumb} alt="" className="w-11 h-14 rounded-md object-cover shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )
        )}
      </div>
    </div>
  );
}
