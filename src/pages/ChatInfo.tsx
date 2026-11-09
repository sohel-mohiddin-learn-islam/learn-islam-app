import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Bell, BellOff, Clock, Palette, Search, Shield, Type, UserRound, Users, MoreHorizontal, MessageSquare, Phone, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DISAPPEAR_OPTIONS, FONTS, THEMES, updateSettings, visibleMessages, watchMessages, watchSettings, previewOf,
  type ChatSettings, type Message,
} from "@/lib/chat";
import { blockUser, getProfile, getRelations, unblockUser, type UserProfile } from "@/lib/social";
import { startCall } from "@/components/CallManager";
import { parseReelMessage } from "@/lib/chat";

type Panel = null | "customize" | "disappear" | "controls" | "privacy" | "nick" | "search" | "options";

const Row = ({ icon, title, sub, onClick }: { icon: any; title: string; sub?: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-3.5 text-left">
    <span className="w-8 flex justify-center">{icon}</span>
    <span><span className="block font-semibold">{title}</span>{sub && <span className="block text-sm text-foreground/60">{sub}</span>}</span>
  </button>
);

export default function ChatInfo() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/chat/:uid/info");
  const other = params?.uid || "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [st, setSt] = useState<ChatSettings>({ theme: "default", font: "default", disappear: 0, muted: {}, general: {}, nicks: {}, clearedAt: {} });
  const [messages, setMessages] = useState<Message[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [nick, setNick] = useState("");
  const [q, setQ] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user || !other) return;
    getProfile(other).then(setProfile).catch(() => {});
    getRelations(user.uid).then((r) => setBlocked(r.blocked.includes(other))).catch(() => {});
    const a = watchSettings(user.uid, other, (s) => { setSt(s); setNick(s.nicks[user.uid] || ""); });
    const b = watchMessages(user.uid, other, setMessages, () => setMessages([]));
    return () => { a(); b(); };
  }, [user?.uid, other]);

  if (!user) { setLocation("/login"); return null; }
  const me = user.uid;
  const save = (patch: Record<string, any>) => updateSettings(me, other, patch).catch(() => setMsg("Could not save. Try again."));
  const visible = visibleMessages(messages, me, st);
  const media = visible.filter((m) => parseReelMessage(m.text));
  const name = st.nicks[me] || profile?.displayName || "";
  const muted = !!st.muted[me];

  const back = () => (panel ? setPanel(null) : setLocation(`/chat/${other}`));

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground font-sans pb-10">
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={back} aria-label="Back"><ArrowLeft /></button>
        {panel && <span className="font-semibold text-lg">{{ customize: "Customize", disappear: "Disappearing messages", controls: "Chat controls", privacy: "Privacy & safety", nick: "Nicknames", search: "Search", options: "Options" }[panel]}</span>}
      </div>

      {!panel && (
        <>
          <div className="flex flex-col items-center mt-2">
            <span className="w-28 h-28 rounded-full bg-muted overflow-hidden flex items-center justify-center text-4xl">
              {profile?.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
            </span>
            <p className="text-2xl font-semibold mt-3">{name || "…"}</p>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center text-sm font-semibold my-6 px-3">
            {[
              [<UserRound key="p" />, "Profile", () => setLocation(`/user/${other}`)],
              [<Search key="s" />, "Search", () => setPanel("search")],
              [muted ? <BellOff key="m" /> : <Bell key="m" />, muted ? "Unmute" : "Mute", () => save({ muted: { [me]: !muted } })],
              [<Phone key="c" />, "Call", () => startCall(other, "audio")],
              [<MoreHorizontal key="o" />, "Options", () => setPanel("options")],
            ].map(([icon, label, fn]: any) => (
              <button key={label} onClick={fn} className="flex flex-col items-center gap-1">{icon}<span>{label}</span></button>
            ))}
          </div>
          <Row icon={<Palette className="text-fuchsia-500" />} title="Customize" sub="Theme and font" onClick={() => setPanel("customize")} />
          <Row icon={<Clock />} title="Disappearing messages" sub={st.disappear ? DISAPPEAR_OPTIONS.find((o) => o[1] === st.disappear)?.[0] : "Off"} onClick={() => setPanel("disappear")} />
          <Row icon={<MessageSquare />} title="Chat controls" onClick={() => setPanel("controls")} />
          <Row icon={<Shield />} title="Privacy & safety" onClick={() => setPanel("privacy")} />
          <Row icon={<Type />} title="Nicknames" sub={st.nicks[me] || undefined} onClick={() => setPanel("nick")} />
          <Row icon={<Users />} title="Create a group chat" onClick={() => setLocation(`/group/new?with=${other}`)} />
          <div className="flex gap-3 px-5 mt-2">
            <button onClick={() => startCall(other, "video")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted"><Video className="w-4 h-4" /> Video call</button>
          </div>
          {msg && <p className="px-5 mt-3 text-sm text-foreground/70">{msg}</p>}
          <h3 className="text-center text-xl font-bold mt-8">Shared media</h3>
          {media.length === 0 ? (
            <p className="text-center text-foreground/60 px-8 mt-1">Reels shared in this chat will appear here.</p>
          ) : (
            <div className="px-5 mt-3 space-y-2">
              {media.map((m) => (
                <button key={m.id} className="block w-full text-left bg-muted rounded-xl px-3 py-2 text-sm" onClick={() => {
                  const r = parseReelMessage(m.text)!;
                  try { sessionStorage.setItem("reel-start", r.id); } catch { /* ignore */ }
                  setLocation("/reels");
                }}>🎬 {previewOf(m.text)}</button>
              ))}
            </div>
          )}
        </>
      )}

      {panel === "customize" && (
        <div className="px-5 space-y-6">
          <div>
            <p className="font-semibold mb-2">Theme</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(THEMES).map(([k, t]) => (
                <button key={k} onClick={() => save({ theme: k })} className={`flex flex-col items-center gap-1 text-xs`}>
                  <span className={`w-11 h-11 rounded-full border-2 ${st.theme === k ? "border-foreground" : "border-transparent"}`} style={{ background: t.bubble || "hsl(var(--primary))" }} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Font</p>
            <div className="space-y-2">
              {Object.entries(FONTS).map(([k, f]) => (
                <button key={k} onClick={() => save({ font: k })} style={f.css ? { fontFamily: f.css } : undefined}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${st.font === k ? "border-primary bg-primary/10" : "border-border"}`}>
                  {f.name} — Assalamu alaikum
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-foreground/60">Theme and font are shared with {name || "this person"}.</p>
        </div>
      )}

      {panel === "disappear" && (
        <div className="px-5 space-y-2">
          {DISAPPEAR_OPTIONS.map(([label, secs]) => (
            <button key={label} onClick={() => save({ disappear: secs })}
              className={`w-full text-left px-4 py-3 rounded-xl border ${st.disappear === secs ? "border-primary bg-primary/10" : "border-border"}`}>{label}</button>
          ))}
          <p className="text-sm text-foreground/60 pt-2">New messages vanish after the chosen time. Messages already sent are not affected.</p>
        </div>
      )}

      {panel === "controls" && (
        <div className="px-5">
          <div className="flex items-center justify-between py-2">
            <span>{st.general[me] ? "Move to Primary" : "Move to General"}</span>
            <button onClick={() => { save({ general: { [me]: !st.general[me] } }); setMsg("Moved."); }} className="px-5 py-2 rounded-xl bg-muted font-semibold">Move</button>
          </div>
          <p className="text-sm text-foreground/60">{name || "They"} won't know they've been moved. You can move them back anytime.</p>
          {msg && <p className="text-sm mt-2 text-primary">{msg}</p>}
        </div>
      )}

      {panel === "privacy" && (
        <div className="px-5 space-y-3">
          <button onClick={async () => { blocked ? await unblockUser(me, other) : await blockUser(me, other); setBlocked(!blocked); }}
            className="w-full text-left px-4 py-3 rounded-xl border border-border">{blocked ? "Unblock" : "Block"} {name}</button>
          <p className="text-sm text-foreground/60">Blocked people can't find your profile or message you. Who can message you is set in Settings.</p>
        </div>
      )}

      {panel === "nick" && (
        <div className="px-5 space-y-3">
          <p className="text-sm text-foreground/60">Only you see this nickname.</p>
          <input value={nick} maxLength={30} onChange={(e) => setNick(e.target.value)} placeholder={profile?.displayName || "Nickname"} className="w-full bg-muted rounded-xl px-4 py-3 outline-none" />
          <button onClick={() => { save({ nicks: { [me]: nick.trim() } }); setPanel(null); }} className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">Save</button>
        </div>
      )}

      {panel === "search" && (
        <div className="px-5">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this chat" className="w-full bg-muted rounded-xl px-4 py-3 outline-none mb-3" />
          <div className="space-y-2">
            {q.trim() && visible.filter((m) => m.text.toLowerCase().includes(q.toLowerCase())).slice(-50).reverse().map((m) => (
              <div key={m.id} className="bg-muted rounded-xl px-3 py-2 text-sm">
                <span className="block text-xs text-foreground/50">{m.from === me ? "You" : name} · {new Date(m.createdAt).toLocaleString()}</span>
                {previewOf(m.text)}
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === "options" && (
        <div className="px-5 space-y-3">
          <button onClick={() => { if (confirm("Delete this conversation for you? The other person keeps their copy.")) { save({ clearedAt: { [me]: Date.now() } }); setLocation("/messages"); } }}
            className="w-full text-left px-4 py-3 rounded-xl border border-border text-red-500">Delete conversation (for me)</button>
          <button onClick={() => { setPanel("privacy"); }} className="w-full text-left px-4 py-3 rounded-xl border border-border">Block or report…</button>
        </div>
      )}
    </div>
  );
}
