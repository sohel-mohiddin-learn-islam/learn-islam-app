import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFollowerIds, getFollowingIds, getProfile } from "@/lib/social";
import { sendMessage } from "@/lib/chat";
import { sendGroupMessage, watchGroups, type Group } from "@/lib/groups";
import { useBackClose } from "@/lib/backButton";

type Person = { uid: string; name: string; photo: string | null };

/** Pick people / groups and send them a copy of a message. */
export default function ForwardSheet({ text, onClose }: { text: string; onClose: () => void }) {
  useBackClose(onClose);
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [q, setQ] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (user) return watchGroups(user.uid, setGroups, () => {}); }, [user?.uid]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const ids = Array.from(new Set([...(await getFollowingIds(user.uid).catch(() => [])), ...(await getFollowerIds(user.uid).catch(() => []))]));
      const list = await Promise.all(ids.slice(0, 60).map((id) => getProfile(id).then((p) => ({ uid: id, name: p.displayName, photo: p.photoURL })).catch(() => null)));
      setPeople(list.filter(Boolean) as Person[]);
    })();
  }, [user?.uid]);

  const shown = useMemo(() => people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [people, q]);
  const send = async (id: string, g?: Group) => {
    if (!user || busy) return;
    setBusy(id); setErr("");
    try {
      if (g) await sendGroupMessage(user.uid, g, text); else await sendMessage(user.uid, id, text);
      setSent((s) => [...s, id]);
    } catch (e: any) { setErr(e?.message || "Could not send."); }
    setBusy("");
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full max-h-[75vh] bg-card text-card-foreground rounded-t-3xl p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
        <h3 className="font-bold mb-2">Forward to…</h3>
        <p className="text-xs text-foreground/60 mb-2 line-clamp-2">{text}</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="bg-muted rounded-full px-4 py-2 outline-none mb-2" />
        {err && <p className="text-sm text-red-400 mb-1">{err}</p>}
        <div className="overflow-y-auto flex-1">
          {groups.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())).map((g) => (
            <Row key={g.id} name={`👥 ${g.name}`} photo={null} done={sent.includes(g.id)} busy={busy === g.id} onSend={() => send(g.id, g)} />
          ))}
          {shown.map((p) => <Row key={p.uid} name={p.name} photo={p.photo} done={sent.includes(p.uid)} busy={busy === p.uid} onSend={() => send(p.uid)} />)}
          {!shown.length && !groups.length && <p className="text-center text-foreground/50 py-6 text-sm">Follow people to forward messages to them.</p>}
        </div>
      </div>
    </div>
  );
}

function Row({ name, photo, done, busy, onSend }: { name: string; photo: string | null; done: boolean; busy: boolean; onSend: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">{photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : "👤"}</span>
      <span className="flex-1 truncate">{name}</span>
      <button disabled={done || busy} onClick={onSend} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${done ? "bg-muted text-foreground/60" : "bg-primary text-primary-foreground"}`}>{done ? "Sent" : busy ? "…" : "Send"}</button>
    </div>
  );
}
