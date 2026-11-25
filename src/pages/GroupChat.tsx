import { Reactable, ReplyQuote } from "@/components/Reactions";
import ForwardSheet from "@/components/ForwardSheet";
import RichText from "@/components/RichText";
import { uploadImage } from "@/lib/posts";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { FONTS, THEMES, parseReelMessage, useHiddenMessages, type Message } from "@/lib/chat";
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
  const [replyTo, setReplyTo] = useState<{ id: string; from: string; text: string } | null>(null);
  const [fwd, setFwd] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
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

  const [hiddenIds, hideMsg] = useHiddenMessages(`group_${gid}`);
  const lastOwnId = (messages.filter((x) => x.from === user?.uid).slice(-1)[0] || { id: "" }).id;
  const shown = (g && user ? visibleGroupMessages(messages, user.uid, g) : []).filter((m) => !hiddenIds.has(m.id));
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
    try { await sendGroupMessage(user.uid, g, text, replyTo); setText(""); setReplyTo(null); } catch (e: any) { setError(e?.message || "Could not send."); }
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-2" style={font ? { fontFamily: font } : undefined}>
        {shown.length === 0 && <p className="text-center text-foreground/50 py-10">Say salam to the group 👋</p>}
        {shown.map((m) => {
          const mine = m.from === user.uid;
          const hidden = containsHiddenWord(m.text);
          const reel = parseReelMessage(m.text);
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && <span className="text-xs text-foreground/50 ml-1">{names[m.from]?.displayName || "…"}</span>}
              <Reactable path={["groups", gid, "messages", m.id]} uid={user.uid} mine={mine} reactions={m.reactions} text={reel ? undefined : m.text} onReply={() => setReplyTo({ id: m.id, from: m.from, text: reel ? "🎬 Reel" : m.text })} onForward={() => setFwd(m.text)} onDeleteMe={() => hideMsg(m.id)} onDeleteAll={mine ? () => { deleteGroupMessage(gid, m.id); } : undefined}>
              <div
                className={`px-3 py-2 rounded-2xl whitespace-pre-wrap break-words ${mine ? (bubble ? "text-white" : "bg-primary text-primary-foreground") : "bg-muted"}`}
                style={mine && bubble ? { backgroundColor: bubble } : undefined}
                onClick={reel ? () => { try { sessionStorage.setItem("reel-start", reel.id); } catch { /* ignore */ } setLocation("/reels"); } : undefined}
              >
                {m.replyTo && !hidden && <ReplyQuote name={m.replyTo.from === user.uid ? "You" : (names[m.replyTo.from]?.displayName || "…")} text={m.replyTo.text} />}
                {hidden ? <i className="opacity-70">Message hidden</i> : reel ? `🎬 Reel${reel.by ? " by " + reel.by : ""} — tap to watch` : <RichText text={m.text} />}
              </div>
              </Reactable>
              {mine && m.id === lastOwnId && (() => {
                const seen = g.members.filter((x) => x !== user.uid && (g.lastRead?.[x] || 0) >= m.createdAt).length;
                return <span className="text-[11px] text-foreground/50 pr-1">{seen ? `Seen by ${seen}` : "Sent"}</span>;
              })()}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {error && <p className="px-4 pb-1 text-sm text-red-400">{error}</p>}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-muted/50 text-sm">
          <div className="flex-1 min-w-0 border-l-4 border-primary pl-2"><div className="font-semibold text-xs">Replying to {replyTo.from === user.uid ? "yourself" : (names[replyTo.from]?.displayName || "…")}</div><div className="truncate text-foreground/70">{replyTo.text}</div></div>
          <button onClick={() => setReplyTo(null)} className="text-xl px-1" aria-label="Cancel reply">✕</button>
        </div>
      )}
      {fwd && <ForwardSheet text={fwd} onClose={() => setFwd(null)} />}
      <div className="flex gap-2 p-3 border-t border-border items-center w-full max-w-full overflow-hidden">
        <label className={`text-2xl cursor-pointer ${photoBusy ? "opacity-40" : ""}`} aria-label="Send a photo">
          📷
          <input type="file" accept="image/*" className="hidden" disabled={photoBusy} onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f || !user || !g) return;
            setPhotoBusy(true); setError("");
            try { const url = await uploadImage(f); await sendGroupMessage(user.uid, g, url, replyTo); setReplyTo(null); }
            catch (err: any) { setError(err?.message || "Could not send the photo."); }
            setPhotoBusy(false);
          }} />
        </label>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={g.disappear ? "Message… (disappearing)" : "Message…"} className="flex-1 min-w-0 w-full bg-muted rounded-full px-4 py-2 outline-none" />
        <button onClick={send} disabled={!text.trim()} className="text-primary font-semibold px-2 shrink-0 disabled:opacity-40">Send</button>
      </div>
    </div>
  );
}
