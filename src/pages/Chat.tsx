import VerifiedBadge from "@/components/VerifiedBadge";
import { Reactable, ReplyQuote } from "@/components/Reactions";
import ForwardSheet from "@/components/ForwardSheet";
import RichText from "@/components/RichText";
import { uploadImage } from "@/lib/posts";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { FONTS, THEMES, deleteChatMessage, useHiddenMessages, markRead, parseReelMessage, sendMessage, setTyping, visibleMessages, watchChat, watchMessages, watchSettings, type ChatSettings, type Message } from "@/lib/chat";
import { startCall } from "@/components/CallManager";
import { deleteDoc, doc as fdoc } from "firebase/firestore";
import { getProfile, type UserProfile } from "@/lib/social";
import { containsHiddenWord } from "@/lib/prefs";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { postThumbnail } from "@/lib/posts";

const thumbCache = new Map<string, string | null>();

/** Instagram-style still picture of a shared reel (looked up from the reel itself, so old messages work too). */
function ReelPreview({ id, by, caption, onOpen }: { id: string; by: string; caption: string; onOpen: () => void }) {
  const [thumb, setThumb] = useState<string | null | undefined>(thumbCache.get(id));
  const [name, setName] = useState(by);
  useEffect(() => {
    if (thumbCache.has(id)) return;
    getDoc(doc(db, "posts", id))
      .then((s) => {
        const d: any = s.data();
        const t = d ? postThumbnail(d) || null : null;
        thumbCache.set(id, t);
        setThumb(t);
        if (!by && d?.userName) setName(d.userName);
      })
      .catch(() => { thumbCache.set(id, null); setThumb(null); });
  }, [id]);
  return (
    <button onClick={onOpen} className="relative w-48 h-80 max-w-[70%] rounded-2xl overflow-hidden border border-border text-left bg-black">
      {thumb ? <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-black" />}
      <span className="absolute inset-x-0 top-0 p-2 bg-gradient-to-b from-black/60 to-transparent text-white text-sm font-semibold truncate">🎬 {name || "Reel"}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-14 h-14 rounded-full bg-black/45 border border-white/70 flex items-center justify-center text-white text-2xl pl-1">▶</span>
      </span>
      <span className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs line-clamp-2">{caption || "Tap to watch"}</span>
    </button>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/chat/:uid");
  const other = params?.uid || "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; from: string; text: string } | null>(null);
  const [fwd, setFwd] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [listenKey, setListenKey] = useState(0);
  const [otherRead, setOtherRead] = useState(0);
  const [otherTyping, setOtherTyping] = useState(0);
  const lastTypingSent = useRef(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [st, setSt] = useState<ChatSettings>({ theme: "default", font: "default", disappear: 0, muted: {}, general: {}, nicks: {}, clearedAt: {} });
  const [tick, setTick] = useState(0);
  const [hiddenIds, hideMsg] = useHiddenMessages(`chat_${[user?.uid || "", other].sort().join("_")}`);
  const shown = (user ? visibleMessages(messages, user.uid, st) : messages).filter((m) => !hiddenIds.has(m.id));
  const bubble = THEMES[st.theme]?.bubble || "";
  const fontCss = FONTS[st.font]?.css || "";
  const title = (user && st.nicks[user.uid]) || profile?.displayName || "…";

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
    return watchChat(user.uid, other, (c) => { setOtherRead(c.lastRead[other] || 0); setOtherTyping(c.typing[other] || 0); });
  }, [user?.uid, other, listenKey]);

  useEffect(() => {
    if (!user || !other) return;
    return watchSettings(user.uid, other, setSt);
  }, [user?.uid, other]);

  // expired disappearing messages vanish live; my own expired ones are also deleted for good
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    messages.filter((m) => m.from === user.uid && m.expiresAt && m.expiresAt < now)
      .forEach((m) => deleteDoc(fdoc(db, "chats", [user.uid, other].sort().join("_"), "messages", m.id)).catch(() => {}));
  }, [tick, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [shown.length]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(user.uid, other, text, replyTo);
      setText("");
      setReplyTo(null);
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
          <span className="text-left"><span className="font-semibold block leading-tight">{title}<VerifiedBadge uid={other} size={14} /></span>{Date.now() - otherTyping < 6000 && otherTyping > 0 && <span className="block text-xs text-primary">typing…</span>}</span>
        </button>
        <span className="ml-auto flex items-center gap-4 text-xl">
          <button onClick={() => startCall(other, "audio")} aria-label="Voice call">📞</button>
          <button onClick={() => startCall(other, "video")} aria-label="Video call">🎥</button>
          <button onClick={() => setLocation(`/chat/${other}/info`)} aria-label="Chat details">ⓘ</button>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={fontCss ? { fontFamily: fontCss } : undefined}>
        {shown.length === 0 && <p className="text-center text-foreground/50 py-10">Say salam 👋</p>}
        {shown.map((m, idx) => {
          const mine = m.from === user.uid;
          const hidden = containsHiddenWord(m.text);
          const reel = parseReelMessage(m.text);
          const lastMine = mine && !shown.slice(idx + 1).some((x) => x.from === user.uid);
          return (
            <div key={m.id}>
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <Reactable path={["chats", [user.uid, other].sort().join("_"), "messages", m.id]} uid={user.uid} mine={mine} reactions={m.reactions} text={reel ? undefined : m.text} onReply={() => setReplyTo({ id: m.id, from: m.from, text: reel ? "🎬 Reel" : m.text })} onForward={() => setFwd(m.text)} onDeleteMe={() => hideMsg(m.id)} onDeleteAll={mine ? () => { deleteChatMessage(user.uid, other, m.id).catch(() => {}); } : undefined}>
                {reel && !hidden ? (
                  <ReelPreview
                    id={reel.id}
                    by={reel.by}
                    caption={reel.caption}
                    onOpen={() => {
                      try { sessionStorage.setItem("reel-start", reel.id); } catch { /* ignore */ }
                      setLocation("/reels");
                    }}
                  />
                ) : (
                  <div
                    className={`px-3 py-2 rounded-2xl whitespace-pre-wrap break-words ${mine ? (bubble ? "text-white" : "bg-primary text-primary-foreground") : "bg-muted"}`}
                    style={mine && bubble ? { backgroundColor: bubble } : undefined}
                  >
                    {m.replyTo && !hidden && <ReplyQuote name={m.replyTo.from === user.uid ? "You" : title} text={m.replyTo.text} />}
                    {hidden ? <i className="opacity-70">Message hidden</i> : <RichText text={m.text} />}
                    {mine && <span className={`float-right ml-2 mt-1 text-[10px] ${otherRead >= m.createdAt ? "text-sky-300" : "opacity-60"}`}>{otherRead >= m.createdAt ? "✓✓" : "✓"}</span>}
                  </div>
                )}
                </Reactable>
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
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-muted/50 text-sm">
          <div className="flex-1 min-w-0 border-l-4 border-primary pl-2"><div className="font-semibold text-xs">Replying to {replyTo.from === user.uid ? "yourself" : title}</div><div className="truncate text-foreground/70">{replyTo.text}</div></div>
          <button onClick={() => setReplyTo(null)} className="text-xl px-1" aria-label="Cancel reply">✕</button>
        </div>
      )}
      {fwd && <ForwardSheet text={fwd} onClose={() => setFwd(null)} />}
      <div className="flex gap-2 p-3 border-t border-border items-center">
        <label className={`text-2xl cursor-pointer ${photoBusy ? "opacity-40" : ""}`} aria-label="Send a photo">
          📷
          <input type="file" accept="image/*" className="hidden" disabled={photoBusy} onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f || !user) return;
            setPhotoBusy(true); setError("");
            try { const url = await uploadImage(f); await sendMessage(user.uid, other, url, replyTo); setReplyTo(null); if (!messages.length) setListenKey((k) => k + 1); }
            catch (err: any) { setError(err?.message || "Could not send the photo."); }
            setPhotoBusy(false);
          }} />
        </label>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (user && e.target.value && Date.now() - lastTypingSent.current > 2500) { lastTypingSent.current = Date.now(); setTyping(user.uid, other); }
          }}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={st.disappear ? "Message… (disappearing)" : "Message…"}
          className="flex-1 bg-muted rounded-full px-4 py-2 outline-none"
        />
        <button onClick={send} disabled={sending || !text.trim()} className="text-primary font-semibold px-2 disabled:opacity-40">
          Send
        </button>
      </div>
    </div>
  );
}
