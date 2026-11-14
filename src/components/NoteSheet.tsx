import { useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendMessage } from "@/lib/chat";
import { getProfile, type UserProfile } from "@/lib/social";
import VerifiedBadge from "@/components/VerifiedBadge";

export type NoteData = { text: string; at: number; naat?: { title: string; url: string } };

const ago = (t: number) => {
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  return m < 60 ? `${m}m` : `${Math.round(m / 60)}h`;
};

/** Instagram-style note sheet. Someone else's note: like it or reply (the reply goes to your chat). Your own: who liked it. */
export default function NoteSheet({
  me, ownerId, note, profile, isOwn, onClose, onOpenChat, onNewNote, onDelete,
}: {
  me: string; ownerId: string; note: NoteData; profile?: UserProfile; isOwn: boolean;
  onClose: () => void; onOpenChat: (id: string) => void; onNewNote: () => void; onDelete: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likers, setLikers] = useState<string[]>([]);
  const [people, setPeople] = useState<Record<string, UserProfile>>({});
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { audio.current?.pause(); }, []);

  useEffect(() => {
    getDocs(collection(db, "users", ownerId, "noteLikes"))
      .then((s) => {
        const ids = s.docs.filter((d) => ((d.data() as any).at || 0) >= note.at).map((d) => d.id);
        setLiked(ids.includes(me));
        if (isOwn) {
          setLikers(ids);
          ids.forEach((id) => getProfile(id).then((p) => setPeople((m) => ({ ...m, [id]: p }))).catch(() => {}));
        }
      })
      .catch(() => {});
  }, [ownerId, note.at, isOwn]);

  const like = async () => {
    const next = !liked;
    setLiked(next);
    try {
      const ref = doc(db, "users", ownerId, "noteLikes", me);
      if (next) await setDoc(ref, { at: Date.now() });
      else await deleteDoc(ref);
    } catch { setLiked(!next); setStatus("Could not like this note."); }
  };

  const send = async () => {
    const r = reply.trim();
    if (!r) return;
    setBusy(true); setStatus("");
    try {
      const what = note.naat ? `🎵 ${note.naat.title}${note.text ? ` · ${note.text}` : ""}` : note.text;
      await sendMessage(me, ownerId, `↩️ Replied to your note: “${what}”\n${r}`);
      setReply("");
      setStatus("Sent ✓");
    } catch (e: any) { setStatus(e?.message || "Could not send. Try again."); }
    setBusy(false);
  };

  const toggleNaat = () => {
    if (!note.naat) return;
    if (playing) { audio.current?.pause(); setPlaying(false); return; }
    const a = new Audio(note.naat.url);
    a.onended = () => setPlaying(false);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    audio.current = a;
  };

  const name = profile?.displayName || "…";
  const photo = profile?.photoURL;

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full max-h-[88%] overflow-y-auto bg-background text-foreground rounded-t-3xl px-5 pt-3 pb-6 font-sans" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-foreground/30 mx-auto mb-5" />
        <div className="flex flex-col items-center text-center">
          <span className="w-24 h-24 rounded-full bg-muted overflow-hidden flex items-center justify-center text-4xl">
            {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : "👤"}
          </span>
          {!isOwn && <p className="mt-2 font-semibold">{name}<VerifiedBadge uid={ownerId} size={14} /></p>}
          <div className="mt-3 max-w-full">
            {note.naat && (
              <button onClick={toggleNaat} className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary font-semibold px-4 py-2 mb-2">
                <span>{playing ? "⏸" : "▶"}</span><span className="truncate max-w-[220px]">🎵 {note.naat.title}</span>
              </button>
            )}
            {note.text && <p className="text-lg font-semibold break-words">{note.text}</p>}
          </div>
          <p className="text-sm text-foreground/60 mt-1">Shared with followers · {ago(note.at)}</p>
        </div>

        {isOwn ? (
          <>
            <div className="mt-5 border-t border-border pt-3">
              {likers.length === 0 && <p className="text-center text-foreground/60 py-4">No likes yet.</p>}
              {likers.map((id) => (
                <div key={id} className="flex items-center gap-3 py-2">
                  <span className="relative w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {people[id]?.photoURL ? <img src={people[id].photoURL!} alt="" className="w-full h-full object-cover" /> : "👤"}
                  </span>
                  <span className="flex-1 font-semibold truncate">{people[id]?.displayName || "…"} <span className="text-pink-500">❤</span></span>
                  <button onClick={() => onOpenChat(id)} aria-label="Message" className="text-xl">✉️</button>
                </div>
              ))}
            </div>
            <button onClick={onNewNote} className="w-full mt-4 rounded-full bg-indigo-500 text-white font-semibold py-3.5">Leave a new note</button>
            <button onClick={onDelete} className="w-full mt-3 text-indigo-400 font-semibold py-2">Delete note</button>
          </>
        ) : (
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <input
                value={reply} onChange={(e) => setReply(e.target.value)} maxLength={500}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder={`Reply to ${name}'s note…`}
                className="flex-1 rounded-full bg-muted px-4 py-3"
              />
              <button onClick={like} aria-label="Like note" className={`w-12 h-12 rounded-full bg-muted text-2xl ${liked ? "text-pink-500" : "text-foreground/70"}`}>{liked ? "❤" : "♡"}</button>
              <button onClick={send} disabled={busy || !reply.trim()} aria-label="Send reply" className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl disabled:opacity-40">➤</button>
            </div>
            {status && <p className="text-sm text-foreground/70 mt-3 text-center">{status}</p>}
            <button onClick={() => onOpenChat(ownerId)} className="w-full mt-4 text-sm text-foreground/60">Open chat</button>
          </div>
        )}
      </div>
    </div>
  );
}
