import { shareContent } from "@/lib/share";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFollowerIds, getFollowingIds, getProfile } from "@/lib/social";
import { sendMessage } from "@/lib/chat";
import { useBackClose } from "@/lib/backButton";
import StoryEditor from "./StoryEditor";
import { addStory } from "@/lib/stories";
import { prepareAudio } from "@/lib/storyTools";
import { notify } from "@/lib/notifications";
import { sendGroupMessage, watchGroups, type Group } from "@/lib/groups";

export const SITE = "https://sohel-mohiddin-learn-islam.github.io/learn-islam-app";
export const reelLink = (id: string) => `${SITE}/reels?reel=${id}`;

type Person = { uid: string; name: string; photo: string | null };
type Target = { id: string; caption?: string; userName?: string; original?: string; src: string; poster?: string };

export default function ShareSheet({ reel, onClose, onShared }: { reel: Target; onClose: () => void; onShared: (recipients: string[]) => void }) {
  useBackClose(onClose);
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]); // user ids or "g:<groupId>"
  const [groups, setGroups] = useState<Group[]>([]);
  const [busy, setBusy] = useState(false);
  const ext = () => `ext_${Date.now()}_${Math.floor(Math.random() * 1e6)}`; // each outside share counts as one person
  const [note, setNote] = useState("");
  const [composer, setComposer] = useState(false);
  const link = reelLink(reel.id);
  const text = `🎬 Reel by ${reel.userName || "Learn Islam User"}${reel.caption ? ": " + reel.caption.slice(0, 80) : ""}`;

  useEffect(() => {
    if (!user) return;
    return watchGroups(user.uid, setGroups, () => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ids = Array.from(new Set([...(await getFollowingIds(user.uid).catch(() => [])), ...(await getFollowerIds(user.uid).catch(() => []))]));
      const list = await Promise.all(
        ids.slice(0, 60).map((id) => getProfile(id).then((p) => ({ uid: id, name: p.displayName, photo: p.photoURL })).catch(() => null))
      );
      setPeople(list.filter(Boolean) as Person[]);
    })();
  }, [user?.uid]);

  const shown = useMemo(() => people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [people, q]);
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(""), 2500); };

  const toggle = (id: string) => setPicked((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  // sends to everyone selected; the share count grows by the number of people reached
  const sendPicked = async () => {
    if (!user || !picked.length || busy) return;
    setBusy(true);
    const reached: string[] = [];
    const failed: string[] = [];
    for (const id of picked) {
      try {
        if (id.startsWith("g:")) {
          const g = groups.find((x) => x.id === id.slice(2));
          if (!g) continue;
          await sendGroupMessage(user.uid, g, `${text}\n${link}`);
          g.members.filter((m) => m !== user.uid).forEach((m) => reached.push(m));
        } else {
          await sendMessage(user.uid, id, `${text}\n${link}`);
          reached.push(id);
        }
      } catch (e: any) {
        failed.push(e?.message || "Could not send.");
      }
    }
    setSent((s) => [...s, ...picked]);
    setPicked([]);
    setBusy(false);
    if (reached.length) onShared(Array.from(new Set(reached)));
    if (failed.length) flash(failed[0]);
    else flash(`Sent to ${reached.length} ${reached.length === 1 ? "person" : "people"}`);
  };

  const open = (url: string, scheme = false) => {
    onShared([ext()]);
    if (scheme) window.location.href = url;
    else window.open(url, "_blank");
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); flash("Link copied"); onShared([ext()]); } catch { flash("Could not copy."); }
  };
  const nativeShare = async () => {
    const r = await shareContent({ title: "Learn Islam", text, url: link });
    if (r === "shared") onShared([ext()]);
    else if (r === "copied") { flash("Link copied"); onShared([ext()]); }
    else flash("Could not share.");
  };
  const toStory = () => setComposer(true);
  const download = () => {
    const url = (reel.original || reel.src).replace("/upload/", "/upload/fl_attachment/");
    open(url);
  };

  const enc = encodeURIComponent;
  const actions: { icon: string; label: string; bg: string; run: () => void }[] = [
    { icon: "➕", label: "Add to story", bg: "bg-white/15", run: toStory },
    { icon: "🟢", label: "WhatsApp Status", bg: "bg-green-500", run: nativeShare },
    { icon: "💬", label: "WhatsApp", bg: "bg-green-500", run: () => open(`https://wa.me/?text=${enc(text + " " + link)}`) },
    { icon: "🔗", label: "Copy link", bg: "bg-white/15", run: copy },
    { icon: "↗️", label: "Share", bg: "bg-white/15", run: nativeShare },
    { icon: "⬇️", label: "Download", bg: "bg-white/15", run: download },
    { icon: "👻", label: "Snapchat", bg: "bg-yellow-400", run: () => open(`https://www.snapchat.com/scan?attachmentUrl=${enc(link)}`) },
    { icon: "✉️", label: "SMS", bg: "bg-blue-600", run: () => open(`sms:?body=${enc(text + " " + link)}`, true) },
    { icon: "🗨️", label: "Messenger", bg: "bg-blue-500", run: () => open(`fb-messenger://share?link=${enc(link)}`, true) },
    { icon: "@", label: "Threads", bg: "bg-black border border-white/30", run: () => open(`https://www.threads.net/intent/post?text=${enc(text + " " + link)}`) },
  ];

  return (
    <>
    {composer && (
      <StoryEditor
        previewUrl={reel.src}
        type="video"
        onClose={() => setComposer(false)}
        onPublish={async ({ overlays, audio, closeOnly }) => {
          if (!user) return;
          const a = await prepareAudio(audio, user.uid);
          await addStory(user.uid, reel.original || reel.src, "video", closeOnly, { reelId: reel.id, overlays, ...a });
          overlays.filter((o) => o.kind === "mention" && o.uid).forEach((o) => notify(o.uid!, user.uid, "mention"));
          setComposer(false);
          onShared([ext()]);
          onClose();
        }}
      />
    )}
    <div className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div className="bg-neutral-900 text-white rounded-t-3xl max-h-[75%] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/40" />
        <div className="px-4 pt-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none placeholder:text-white/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 grid grid-cols-3 gap-y-5 min-h-[140px]">
          {shown.length === 0 && groups.length === 0 && <p className="col-span-3 text-center text-white/60 py-6">Follow people to send them reels directly.</p>}
          {groups.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())).map((g) => {
            const id = `g:${g.id}`;
            return (
              <button key={id} onClick={() => toggle(id)} className="flex flex-col items-center gap-1.5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10">
                  {g.photo ? <img src={g.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👥</div>}
                  {picked.includes(id) && <div className="absolute inset-0 bg-green-600/70 flex items-center justify-center text-2xl">✓</div>}
                </div>
                <span className="text-sm truncate w-24 text-center">{g.name}</span>
              </button>
            );
          })}
          {shown.map((p) => (
            <button key={p.uid} onClick={() => toggle(p.uid)} className="flex flex-col items-center gap-1.5">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10">
                {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                {picked.includes(p.uid) && <div className="absolute inset-0 bg-green-600/70 flex items-center justify-center text-2xl">✓</div>}
                {!picked.includes(p.uid) && sent.includes(p.uid) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-2xl">✓</div>}
              </div>
              <span className="text-sm truncate w-24 text-center">{sent.includes(p.uid) && !picked.includes(p.uid) ? "Sent" : p.name}</span>
            </button>
          ))}
        </div>
        {picked.length > 0 && (
          <div className="px-4 pb-3">
            <button onClick={sendPicked} disabled={busy} className="w-full rounded-xl bg-blue-600 py-3 font-semibold disabled:opacity-60">
              {busy ? "Sending…" : `Send to ${picked.length}`}
            </button>
          </div>
        )}
        {note && <p className="text-center text-sm text-white/80 pb-2">{note}</p>}
        <div className="border-t border-white/10 px-2 py-4 flex gap-1 overflow-x-auto">
          {actions.map((a) => (
            <button key={a.label} onClick={a.run} className="flex flex-col items-center gap-2 w-[76px] shrink-0">
              <span className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${a.bg}`}>{a.icon}</span>
              <span className="text-xs text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
