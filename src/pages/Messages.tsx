import VerifiedBadge from "@/components/VerifiedBadge";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { previewOf, timeAgo, watchInbox, type ChatSummary } from "@/lib/chat";
import { getProfile, getFollowingIds, type UserProfile } from "@/lib/social";
import { containsHiddenWord } from "@/lib/prefs";
import { getNaats, type Naat } from "@/lib/storyTools";
import { watchGroups, type Group } from "@/lib/groups";

type Tab = "primary" | "requests" | "general";
type Note = { text: string; at: number; naat?: { title: string; url: string } };
const DAY = 86400000;

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [following, setFollowing] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const t = sessionStorage.getItem("inbox-tab") as Tab | null;
      sessionStorage.removeItem("inbox-tab");
      if (t === "primary" || t === "general" || t === "requests") return t;
    } catch { /* ignore */ }
    return "primary";
  });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [editNote, setEditNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  const loadNotes = async (ids: string[]) => {
    const out: Record<string, Note> = {};
    await Promise.all(
      ids.slice(0, 40).map(async (id) => {
        try {
          const d: any = (await getDoc(doc(db, "users", id))).data();
          if ((d?.note || d?.noteNaat) && d.noteAt && Date.now() - d.noteAt < DAY) out[id] = { text: d.note || "", at: d.noteAt, naat: d.noteNaat?.url ? d.noteNaat : undefined };
        } catch { /* ignore */ }
      })
    );
    setNotes(out);
  };

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
    const stopGroups = watchGroups(user.uid, setGroups, () => {});
    getFollowingIds(user.uid)
      .then((ids) => {
        setFollowing(ids);
        ids.forEach((id) => getProfile(id).then((p) => setProfiles((m) => ({ ...m, [id]: p }))).catch(() => {}));
        loadNotes([user.uid, ...ids]);
      })
      .catch(() => {});
    return () => { stop(); stopGroups(); };
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !chats) return;
    chats.forEach((c) => {
      const other = c.participants.find((p) => p !== user.uid);
      if (other && !profiles[other]) getProfile(other).then((p) => setProfiles((m) => ({ ...m, [other]: p }))).catch(() => {});
    });
  }, [chats]);

  const rows = useMemo(() => {
    if (!user || !chats) return [];
    return chats
      .map((c) => {
        const other = c.participants.find((p) => p !== user.uid) || "";
        const iFollow = following.includes(other);
        const iSent = !!c.sentBy[user.uid] || c.lastSender === user.uid;
        const unread = c.lastSender !== user.uid && c.lastAt > (c.lastRead[user.uid] || 0);
        const seen = c.lastSender === user.uid && (c.lastRead[other] || 0) >= c.lastAt;
        const g = c.general?.[user.uid];
        const kind: Tab = g === true ? "general" : g === false ? "primary" : iFollow ? "primary" : iSent ? "general" : "requests";
        return { c, other, unread, seen, kind };
      })
      .filter((r) => r.kind === tab)
      .filter((r) => !unreadOnly || r.unread)
      .filter((r) => !q || (profiles[r.other]?.displayName || "").toLowerCase().includes(q.toLowerCase()));
  }, [chats, following, tab, unreadOnly, q, profiles, user?.uid]);

  const counts = useMemo(() => {
    const out = { primary: 0, requests: 0, general: 0 };
    if (!user || !chats) return out;
    chats.forEach((c) => {
      const other = c.participants.find((p) => p !== user.uid) || "";
      const iSent = !!c.sentBy[user.uid] || c.lastSender === user.uid;
      const g = c.general?.[user.uid];
      const kind: Tab = g === true ? "general" : g === false ? "primary" : following.includes(other) ? "primary" : iSent ? "general" : "requests";
      if (c.lastSender !== user.uid && c.lastAt > (c.lastRead[user.uid] || 0)) out[kind]++;
    });
    return out;
  }, [chats, following, user?.uid]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const saveNote = async (override?: string) => {
    const t = (override ?? noteText).trim().slice(0, 60);
    const naat = override === "" ? null : pickedNaat;
    const empty = !t && !naat;
    await setDoc(doc(db, "users", user.uid), { note: t, noteNaat: naat ? { title: naat.title, url: naat.url } : null, noteAt: empty ? 0 : Date.now() }, { merge: true }).catch(() => {});
    setNotes((n) => {
      const c = { ...n };
      if (!empty) c[user.uid] = { text: t, at: Date.now(), naat: naat ? { title: naat.title, url: naat.url } : undefined };
      else delete c[user.uid];
      return c;
    });
    stopNaat();
    setEditNote(false);
  };

  // Naat Sharif on a note: tap the 🎵 on someone's note to listen
  const [naats, setNaats] = useState<Naat[] | null>(null);
  const [pickedNaat, setPickedNaat] = useState<Naat | null>(null);
  const [showNaats, setShowNaats] = useState(false);
  const [playing, setPlaying] = useState("");
  const noteAudio = useRef<HTMLAudioElement | null>(null);
  const stopNaat = () => { noteAudio.current?.pause(); setPlaying(""); };
  const playNaat = (url: string) => {
    if (playing === url) return stopNaat();
    noteAudio.current?.pause();
    const a = new Audio(url);
    a.onended = () => setPlaying("");
    a.play().catch(() => setPlaying(""));
    noteAudio.current = a;
    setPlaying(url);
  };
  useEffect(() => () => { noteAudio.current?.pause(); }, []);
  const openNaatPicker = () => {
    setShowNaats(true);
    if (naats === null) getNaats().then(setNaats).catch(() => setNaats([]));
  };

  const noteBubble = (text: string, naat?: { title: string; url: string }) => (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-[92px] rounded-xl bg-muted px-2 py-1 text-[11px] shadow text-center">
      {naat && (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); playNaat(naat.url); }}
          className="block truncate text-primary font-semibold"
        >{playing === naat.url ? "⏸" : "🎵"} {naat.title}</span>
      )}
      {text && <span className="block truncate">{text}</span>}
    </span>
  );

  const Chip = ({ t, label }: { t: Tab; label: string }) => (
    <button onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 border text-sm font-semibold ${tab === t ? "bg-muted border-transparent" : "border-border text-foreground/70"}`}>
      {label} {counts[t] > 0 && <span className="text-primary">{counts[t]}</span>}
    </button>
  );

  const noteIds = Object.keys(notes).filter((id) => id !== user.uid);

  return (
    <div className="min-h-full bg-background text-foreground font-sans">
      <div className="max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-4 px-4 py-4 sticky top-0 bg-background z-10">
          <button onClick={() => window.history.back()} className="text-2xl" aria-label="Back">←</button>
          <h1 className="text-lg font-semibold flex-1 truncate">{user.displayName || "Messages"}<VerifiedBadge uid={user.uid} /></h1>
          <button onClick={() => setLocation("/group/new")} aria-label="New group" className="text-xl">👥</button>
          <button onClick={() => setLocation("/dashboard")} aria-label="Dashboard" className="text-xl">📈</button>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2.5">
            <span>🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="flex-1 bg-transparent outline-none" />
          </div>
        </div>

        {/* Notes row: your note and notes of people you follow (24 hours) */}
        <div className="flex gap-4 overflow-x-auto px-4 pt-8 pb-2">
          <button onClick={() => { setNoteText(notes[user.uid]?.text || ""); setPickedNaat(notes[user.uid]?.naat ? ({ id: "cur", title: notes[user.uid].naat!.title, artist: "", url: notes[user.uid].naat!.url, license: "" } as Naat) : null); setShowNaats(false); setEditNote(true); }} className="relative flex flex-col items-center shrink-0 w-20">
            {notes[user.uid] ? noteBubble(notes[user.uid].text, notes[user.uid].naat) : noteBubble("Your note")}
            <span className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
            </span>
            <span className="text-xs mt-1 text-foreground/60">Your note</span>
          </button>
          {noteIds.map((id) => (
            <button key={id} onClick={() => setLocation(`/chat/${id}`)} className="relative flex flex-col items-center shrink-0 w-20">
              {noteBubble(notes[id].text, notes[id].naat)}
              <span className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {profiles[id]?.photoURL ? <img src={profiles[id].photoURL!} alt="" className="w-full h-full object-cover" /> : "👤"}
              </span>
              <span className="text-xs mt-1 truncate w-full text-center">{profiles[id]?.displayName || "…"}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          <button onClick={() => setUnreadOnly((v) => !v)} className={`rounded-full px-4 py-1.5 border text-sm font-semibold ${unreadOnly ? "bg-primary text-primary-foreground border-transparent" : "border-border"}`}>
            ⚙︎ Unread
          </button>
          <Chip t="primary" label="Primary" />
          <Chip t="requests" label="Requests" />
          <Chip t="general" label="General" />
        </div>

        {chats === null && <p className="p-6 text-foreground/60">Loading…</p>}
        {chats && rows.length === 0 && (
          <p className="p-6 text-foreground/60">
            {error || (tab === "primary" ? "No conversations yet. Open a profile of someone you follow and press Message." : tab === "requests" ? "No message requests." : "Nothing here.")}
          </p>
        )}

        {tab === "primary" && groups
          .filter((g) => !unreadOnly || (g.lastSender !== user.uid && g.lastAt > (g.lastRead[user.uid] || 0)))
          .filter((g) => !q || g.name.toLowerCase().includes(q.toLowerCase()))
          .map((g) => {
            const unread = g.lastSender !== user.uid && g.lastAt > (g.lastRead[user.uid] || 0) && !g.muted[user.uid];
            return (
              <button key={g.id} onClick={() => setLocation(`/group/${g.id}`)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left">
                <span className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 text-2xl">
                  {g.photo ? <img src={g.photo} alt="" className="w-full h-full object-cover" /> : "👥"}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block truncate ${unread ? "font-bold" : "font-semibold"}`}>{g.name}</span>
                  <span className={`block text-sm truncate ${unread ? "text-foreground font-semibold" : "text-foreground/60"}`}>{previewOf(g.lastMessage)} · {timeAgo(g.lastAt)}</span>
                </span>
                {unread && <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />}
              </button>
            );
          })}

        {rows.map(({ c, other, unread, seen }) => {
          const pr = profiles[other];
          const raw = previewOf(c.lastMessage);
          const preview = containsHiddenWord(c.lastMessage) ? "Message hidden" : raw;
          return (
            <button key={c.id} onClick={() => setLocation(`/chat/${other}`)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left">
              <span className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {pr?.photoURL ? <img src={pr.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block truncate ${unread ? "font-bold" : "font-semibold"}`}>{pr?.displayName || "…"}<VerifiedBadge uid={other} size={14} /></span>
                <span className={`block text-sm truncate ${unread ? "text-foreground font-semibold" : "text-foreground/60"}`}>
                  {c.lastSender === user.uid ? (seen ? "Seen" : "Sent") : preview}
                  {c.lastSender === user.uid && <> · {preview}</>}
                  {" · "}{timeAgo(c.lastAt)}
                </span>
              </span>
              {unread && <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {editNote && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => { stopNaat(); setEditNote(false); }}>
          <div className="w-full bg-background rounded-t-3xl p-5 max-h-[85%] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-lg mb-1">Share a note</h2>
            <p className="text-sm text-foreground/60 mb-3">Followers see it for 24 hours.</p>
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={60} placeholder="What's on your mind?" className="w-full rounded-lg bg-muted px-3 py-3 mb-3" />
            {pickedNaat ? (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 mb-3">
                <span>🎵</span><span className="flex-1 truncate font-semibold">{pickedNaat.title}</span>
                <button onClick={() => { setPickedNaat(null); stopNaat(); }} aria-label="Remove Naat">✕</button>
              </div>
            ) : (
              <button onClick={openNaatPicker} className="w-full rounded-lg border border-border py-3 mb-3 font-semibold">🎵 Add Naat Sharif</button>
            )}
            {showNaats && !pickedNaat && (
              <div className="rounded-lg border border-border mb-3 max-h-56 overflow-y-auto divide-y divide-border">
                {naats === null && <p className="p-3 text-foreground/60">Loading…</p>}
                {naats?.length === 0 && <p className="p-3 text-foreground/60">No Naats added yet.</p>}
                {naats?.map((n) => (
                  <div key={n.id} className="flex items-center gap-2 px-3 py-2">
                    <button onClick={() => playNaat(n.url)} className="w-9 h-9 rounded-full bg-muted shrink-0">{playing === n.url ? "⏸" : "▶"}</button>
                    <span className="flex-1 min-w-0"><span className="block truncate font-semibold">{n.title}</span><span className="block truncate text-xs text-foreground/60">{n.artist}</span></span>
                    <button onClick={() => { setPickedNaat(n); setShowNaats(false); stopNaat(); }} className="text-primary font-semibold">Select</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {notes[user.uid] && <button onClick={() => saveNote("")} className="flex-1 rounded-lg border border-border py-3">Delete</button>}
              <button onClick={() => saveNote()} className="flex-1 rounded-lg bg-primary text-primary-foreground py-3 font-semibold">Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
