import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { FONTS, THEMES, parseReelMessage, type Message } from "@/lib/chat";
import { markGroupRead, sendGroupMessage, visibleGroupMessages, watchGroup, watchGroupMessages, deleteGroupMessage, type Group } from "@/lib/groups";
import { getProfile, type UserProfile } from "@/lib/social";
import { startGroupCall, joinCall } from "@/components/CallManager";
import { watchLiveCalls, type GCall } from "@/lib/groupcall";
import { containsHiddenWord } from "@/lib/prefs";

export default function GroupChat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/group/:gid");
  const gid = params?.gid || "";
  const [g, setG] = useState<Group | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, UserProfile>>({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [live, setLive] = useState<GCall | null>(null);
  const [, setTick] = useState(0);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !gid) return;
    const a = watchGroup(gid, setG);
    const b = watchGroupMessages(gid, setMessages);
    const c = watchLiveCalls(user.uid, (l) => setLive(l.find((x) => x.gid === gid) || null));
    const t = setInterval(() => setTick((n) => n + 1), 15000);
    return () => { a(); b(); c(); clearInterval(t); };
  }, [user?.uid, gid]);

  useEffect(() => {
    g?.members.forEach((m) => { if (!names[m]) getProfile(m).then((p) => setNames((o) => ({ ...o, [m]: p }))).catch(() => {}); });
  }, [g?.members.join(",")]);

  const shown = g && user ? visibleGroupMessages(messages, user.uid, g) : [];
  useEffect(() => { if (user && shown.length) markGroupRead(user.uid, gid); end.current?.scrollIntoView({ behavior: "smooth" }); }, [shown.length]);
  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    messages.filter((m) => m.from === user.uid && m.expiresAt && m.expiresAt < now).forEach((m) => deleteGroupMessage(gid, m.id));
  }, [messages.length]);

  if (!user) { setLocation("/login"); return null; }
  if (g === undefined) return <p className="p-6">Loading…</p>;
  if (g === null || !g.members.includes(user.uid)) return <p className="p-6">This group is not available.</p>;

  const bubble = THEMES[g.theme]?.bubble || "";
  const font = FONTS[g.font]?.css || "";
  const send = async () => {
    if (!text.trim()) return;
    setError("");
    try { await sendGroupMessage(user.uid, g, text); setText(""); } catch (e: any) { setError(e?.message || "Could not send."); }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-sans">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
        <button onClick={() => setLocation(`/group/${gid}/info`)} className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
            {g.photo ? <img src={g.photo} alt="" className="w-full h-full object-cover" /> : "👥"}
          </span>
          <span className="text-left min-w-0"><span className="block font-semibold truncate">{g.name}</span><span className="block text-xs text-foreground/60">{g.members.length} members</span></span>
        </button>
        <span className="ml-auto flex items-center gap-4 text-xl">
          <button onClick={() => startGroupCall(gid, "audio")} aria-label="Group voice call">📞</button>
          <button onClick={() => startGroupCall(gid, "video")} aria-label="Group video call">🎥</button>
          <button onClick={() => setLocation(`/group/${gid}/info`)} aria-label="Group details">ⓘ</button>
        </span>
      </div>
      {live && live.active.length > 0 && !live.active.includes(user.uid) && (
        <button onClick={() => joinCall(live.id, live.type)} className="bg-green-600 text-white text-sm py-2 font-semibold">
          {live.type === "video" ? "📹" : "📞"} Call in progress · {live.active.length} in call · Tap to join
        </button>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={font ? { fontFamily: font } : undefined}>
        {shown.length === 0 && <p className="text-center text-foreground/50 py-10">Say salam to the group 👋</p>}
        {shown.map((m) => {
          const mine = m.from === user.uid;
          const hidden = containsHiddenWord(m.text);
          const reel = parseReelMessage(m.text);
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && <span className="text-xs text-foreground/50 ml-1">{names[m.from]?.displayName || "…"}</span>}
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl whitespace-pre-wrap break-words ${mine ? (bubble ? "text-white" : "bg-primary text-primary-foreground") : "bg-muted"}`}
                style={mine && bubble ? { backgroundColor: bubble } : undefined}
                onClick={reel ? () => { try { sessionStorage.setItem("reel-start", reel.id); } catch { /* ignore */ } setLocation("/reels"); } : undefined}
              >
                {hidden ? <i className="opacity-70">Message hidden</i> : reel ? `🎬 Reel${reel.by ? " by " + reel.by : ""} — tap to watch` : m.text}
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {error && <p className="px-4 pb-1 text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 p-3 border-t border-border">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={g.disappear ? "Message… (disappearing)" : "Message…"} className="flex-1 bg-muted rounded-full px-4 py-2 outline-none" />
        <button onClick={send} disabled={!text.trim()} className="text-primary font-semibold px-2 disabled:opacity-40">Send</button>
      </div>
    </div>
  );
}
