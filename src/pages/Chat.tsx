import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { markRead, parseReelMessage, sendMessage, watchChat, watchMessages, type Message } from "@/lib/chat";
import { getProfile, type UserProfile } from "@/lib/social";
import { containsHiddenWord } from "@/lib/prefs";

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/chat/:uid");
  const other = params?.uid || "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [listenKey, setListenKey] = useState(0);
  const [otherRead, setOtherRead] = useState(0);

  useEffect(() => {
    if (!user || !other) return;
    getProfile(other).then(setProfile).catch(() => {});
    // before the first message the chat does not exist yet, so reading it can fail: treat as empty
    const stop = watchMessages(user.uid, other, setMessages, () => setMessages([]));
    return stop;
  }, [user?.uid, other, listenKey]);

  // mark as read when opened and whenever new messages arrive while open; watch when the other person has read
  useEffect(() => {
    if (!user || !other || messages.length === 0) return;
    markRead(user.uid, other);
  }, [messages.length, user?.uid, other]);

  useEffect(() => {
    if (!user || !other) return;
    return watchChat(user.uid, other, (c) => setOtherRead(c.lastRead[other] || 0));
  }, [user?.uid, other, listenKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(user.uid, other, text);
      setText("");
      if (!messages.length) setListenKey((k) => k + 1); // the chat exists now: start listening
    } catch (e: any) {
      setError(e?.message || "Could not send the message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-sans">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
        <button onClick={() => setLocation(`/user/${other}`)} className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center">
            {profile?.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
          </span>
          <span className="font-semibold">{profile?.displayName || "…"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && <p className="text-center text-foreground/50 py-10">Say salam 👋</p>}
        {messages.map((m, idx) => {
          const mine = m.from === user.uid;
          const hidden = containsHiddenWord(m.text);
          const reel = parseReelMessage(m.text);
          const lastMine = mine && !messages.slice(idx + 1).some((x) => x.from === user.uid);
          return (
            <div key={m.id}>
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                {reel && !hidden ? (
                  <button
                    onClick={() => {
                      try { sessionStorage.setItem("reel-start", reel.id); } catch { /* ignore */ }
                      setLocation("/reels");
                    }}
                    className={`max-w-[78%] text-left rounded-2xl overflow-hidden border border-border ${mine ? "bg-primary/10" : "bg-muted"}`}
                  >
                    <span className="block h-28 w-44 bg-gradient-to-br from-emerald-900 to-black text-white flex items-center justify-center text-4xl">▶️</span>
                    <span className="block px-3 py-2">
                      <span className="block font-semibold text-sm">Reel{reel.by ? ` by ${reel.by}` : ""}</span>
                      {reel.caption && <span className="block text-sm text-foreground/70 truncate w-40">{reel.caption}</span>}
                      <span className="block text-xs text-primary mt-1">Tap to watch</span>
                    </span>
                  </button>
                ) : (
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl whitespace-pre-wrap break-words ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {hidden ? <i className="opacity-70">Message hidden</i> : m.text}
                  </div>
                )}
              </div>
              {lastMine && (
                <p className="text-right text-xs text-foreground/50 pr-1 mt-0.5">{otherRead >= m.createdAt ? "Seen" : "Sent"}</p>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <p className="px-4 pb-1 text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 p-3 border-t border-border">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message…"
          className="flex-1 bg-muted rounded-full px-4 py-2 outline-none"
        />
        <button onClick={send} disabled={sending || !text.trim()} className="text-primary font-semibold px-2 disabled:opacity-40">
          Send
        </button>
      </div>
    </div>
  );
}
