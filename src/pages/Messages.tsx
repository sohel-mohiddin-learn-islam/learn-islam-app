import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { watchInbox, type ChatSummary } from "@/lib/chat";
import { getProfile, getFollowingIds, type UserProfile } from "@/lib/social";
import { containsHiddenWord } from "@/lib/prefs";

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const stop = watchInbox(
      user.uid,
      (list) => setChats(list),
      (e) => {
        console.error(e);
        setChats([]);
        setError("Could not load your messages.");
      }
    );
    getFollowingIds(user.uid)
      .then((ids) => Promise.all(ids.map((id) => getProfile(id))))
      .then(setPeople)
      .catch(() => {});
    return stop;
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !chats) return;
    chats.forEach((c) => {
      const other = c.participants.find((p) => p !== user.uid);
      if (other && !profiles[other]) getProfile(other).then((p) => setProfiles((m) => ({ ...m, [other]: p })));
    });
  }, [chats]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-4 px-4 py-4 sticky top-0 bg-background z-10">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>

        {people.length > 0 && (
          <div className="flex gap-4 overflow-x-auto px-4 pb-3">
            {people.map((p) => (
              <button key={p.uid} onClick={() => setLocation(`/chat/${p.uid}`)} className="flex flex-col items-center shrink-0 w-16">
                <span className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                  {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
                </span>
                <span className="text-xs mt-1 truncate w-full text-center">{p.displayName}</span>
              </button>
            ))}
          </div>
        )}

        {chats === null && <p className="p-6 text-foreground/60">Loading…</p>}
        {chats && chats.length === 0 && (
          <p className="p-6 text-foreground/60">{error || "No conversations yet. Tap someone you follow above, or open a profile and press Message."}</p>
        )}

        {chats?.map((c) => {
          const other = c.participants.find((p) => p !== user.uid) || "";
          const pr = profiles[other];
          const preview = containsHiddenWord(c.lastMessage) ? "Message hidden" : c.lastMessage;
          return (
            <button key={c.id} onClick={() => setLocation(`/chat/${other}`)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left">
              <span className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {pr?.photoURL ? <img src={pr.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold truncate">{pr?.displayName || "…"}</span>
                <span className="block text-sm text-foreground/60 truncate">
                  {c.lastSender === user.uid ? "You: " : ""}
                  {preview}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
