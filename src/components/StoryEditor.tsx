import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBackClose } from "@/lib/backButton";
import { getFollowerIds, getFollowingIds, getProfile } from "@/lib/social";
import { COLORS, STICKERS, TEXT_STYLES, getNaats, searchUsers, type Naat, type Overlay, type PickedAudio } from "@/lib/storyTools";
import { getCloseFriendIds, setCloseFriend } from "@/lib/stories";
import { overlayStyle } from "./OverlayLayer";

export type EditorResult = { overlays: Overlay[]; audio: PickedAudio | null; closeOnly: boolean };

type Panel = null | "text" | "sticker" | "music" | "mention" | "close";
type Person = { uid: string; name: string; photo: string | null };

const uid = () => Math.random().toString(36).slice(2, 9);

export default function StoryEditor({
  previewUrl, type, onClose, onPublish,
}: {
  previewUrl: string;
  type: "image" | "video";
  onClose: () => void;
  onPublish: (r: EditorResult) => Promise<void>;
}) {
  useBackClose(onClose);
  const { user } = useAuth();
  const stageRef = useRef<HTMLDivElement>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [audio, setAudio] = useState<PickedAudio | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const drag = useRef<string | null>(null);

  // text tool state
  const [text, setText] = useState("");
  const [tStyle, setTStyle] = useState("classic");
  const [tColor, setTColor] = useState("#ffffff");

  // mention state
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [results, setResults] = useState<Person[]>([]);

  // music state
  const [naats, setNaats] = useState<Naat[] | null>(null);
  const [preview, setPreview] = useState<string>("");
  const previewAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (panel === "music" && naats === null) getNaats().then(setNaats);
    if (panel !== "music") { previewAudio.current?.pause(); setPreview(""); }
    if (panel === "mention" && people.length === 0 && user) {
      (async () => {
        const ids = Array.from(new Set([...(await getFollowingIds(user.uid).catch(() => [])), ...(await getFollowerIds(user.uid).catch(() => []))])).slice(0, 40);
        const list = await Promise.all(ids.map((id) => getProfile(id).then((p) => ({ uid: id, name: p.displayName, photo: p.photoURL })).catch(() => null)));
        setPeople(list.filter(Boolean) as Person[]);
      })();
    }
  }, [panel]);

  useEffect(() => {
    const t = setTimeout(() => { searchUsers(q).then(setResults).catch(() => setResults([])); }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const add = (o: Omit<Overlay, "id" | "x" | "y" | "scale"> & { scale?: number }) => {
    const n: Overlay = { id: uid(), x: 50, y: 40 + Math.random() * 15, scale: 1, ...o };
    setOverlays((l) => [...l, n]);
    setSel(n.id);
    setPanel(null);
  };

  const move = (e: React.PointerEvent, id: string) => {
    if (drag.current !== id || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.min(98, Math.max(2, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(98, Math.max(2, ((e.clientY - r.top) / r.height) * 100));
    setOverlays((l) => l.map((o) => (o.id === id ? { ...o, x, y } : o)));
  };

  const selected = overlays.find((o) => o.id === sel);
  const resize = (d: number) => setOverlays((l) => l.map((o) => (o.id === sel ? { ...o, scale: Math.min(3, Math.max(0.4, o.scale + d)) } : o)));
  const remove = () => { setOverlays((l) => l.filter((o) => o.id !== sel)); setSel(null); };

  // close friends: if the list is empty, open it (with followers) so the person can add people first
  const [cfPeople, setCfPeople] = useState<Person[] | null>(null);
  const [cfIds, setCfIds] = useState<string[]>([]);
  const openCloseFriends = async () => {
    if (!user || busy) return;
    setError("");
    let ids: string[] = [];
    try { ids = await getCloseFriendIds(user.uid); } catch { /* treat as empty */ }
    if (ids.length > 0) return publish(true);
    setCfIds([]);
    setPanel("close");
    setCfPeople(null);
    try {
      const followers = await getFollowerIds(user.uid).catch(() => []);
      const list = await Promise.all(followers.slice(0, 80).map((id) => getProfile(id).then((p) => ({ uid: id, name: p.displayName, photo: p.photoURL })).catch(() => null)));
      setCfPeople(list.filter(Boolean) as Person[]);
    } catch { setCfPeople([]); }
  };
  const toggleClose = async (id: string) => {
    if (!user) return;
    const on = !cfIds.includes(id);
    setCfIds((a) => (on ? [...a, id] : a.filter((x) => x !== id)));
    await setCloseFriend(user.uid, id, on).catch(() => setCfIds((a) => (on ? a.filter((x) => x !== id) : [...a, id])));
  };

  const publish = async (closeOnly: boolean) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onPublish({ overlays, audio, closeOnly });
    } catch (e: any) {
      setError(e?.message || "Could not share your story.");
      setBusy(false);
    }
  };

  const tool = (icon: string, label: string, p: Panel) => (
    <button onClick={() => setPanel(p)} aria-label={label} className="w-12 h-12 rounded-full bg-black/55 text-white text-xl flex items-center justify-center">{icon}</button>
  );

  const playPreview = (n: Naat) => {
    if (preview === n.id) { previewAudio.current?.pause(); setPreview(""); return; }
    previewAudio.current?.pause();
    const a = new Audio(n.url);
    previewAudio.current = a;
    a.play().catch(() => {});
    setPreview(n.id);
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black text-white flex flex-col">
      <div className="flex-1 min-h-0 m-3 mb-0 rounded-3xl bg-neutral-900 relative overflow-hidden flex items-center justify-center">
        <button onClick={onClose} aria-label="Back" className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full bg-black/55 text-2xl flex items-center justify-center">←</button>
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          {tool("Aa", "Text", "text")}
          {tool("🕌", "Stickers", "sticker")}
          {tool("🎵", "Naat / music", "music")}
          {tool("@", "Mention", "mention")}
        </div>

        <div
          ref={stageRef}
          className="relative bg-black overflow-hidden"
          style={{ aspectRatio: "9 / 16", height: "100%", maxWidth: "100%", containerType: "inline-size" }}
          onPointerDown={() => setSel(null)}
        >
          {type === "video" ? (
            <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
          ) : (
            <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}

          {overlays.map((o) => {
            const s = overlayStyle(o);
            return (
              <div
                key={o.id}
                onPointerDown={(e) => { e.stopPropagation(); drag.current = o.id; setSel(o.id); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
                onPointerMove={(e) => move(e, o.id)}
                onPointerUp={() => (drag.current = null)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 select-none ${s.className} ${sel === o.id ? "outline outline-2 outline-dashed outline-white/80" : ""}`}
                style={{ left: `${o.x}%`, top: `${o.y}%`, touchAction: "none", ...s.style }}
              >
                {o.kind === "mention" ? `@${o.text}` : o.text}
              </div>
            );
          })}

          {audio && (
            <div className="absolute bottom-3 left-3 right-3 bg-black/60 rounded-full px-4 py-2 text-sm flex items-center gap-2">
              <span>🎵</span><span className="flex-1 truncate">{audio.title}</span>
              <button onClick={() => setAudio(null)} aria-label="Remove music">✕</button>
            </div>
          )}
        </div>

        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/70 rounded-full px-3 py-2">
            <button onClick={() => resize(-0.2)} className="w-9 h-9 text-xl">−</button>
            <button onClick={() => resize(0.2)} className="w-9 h-9 text-xl">＋</button>
            <button onClick={remove} className="w-9 h-9 text-lg" aria-label="Delete">🗑</button>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm text-center pt-2 px-4">{error}</p>}
      <div className="flex gap-3 p-3 pb-6">
        <button disabled={busy} onClick={() => publish(false)} className="flex-1 rounded-full bg-white/10 py-4 font-semibold disabled:opacity-50">
          {busy ? "Sharing…" : "Your story"}
        </button>
        <button disabled={busy} onClick={openCloseFriends} className="flex-1 rounded-full bg-white/10 py-4 font-semibold disabled:opacity-50">
          <span className="inline-block w-5 h-5 rounded-full bg-green-500 mr-2 align-middle text-xs leading-5">★</span>Close Friends
        </button>
      </div>

      {panel && (
        <div className="absolute inset-0 z-30 bg-black/60 flex flex-col justify-end" onClick={() => setPanel(null)}>
          <div className="bg-neutral-900 rounded-t-3xl max-h-[78%] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/40" />

            {panel === "close" && (
              <>
                <p className="font-semibold text-lg mb-1">Add close friends</p>
                <p className="text-sm text-white/60 mb-3">Your close friends list is empty. Pick people from your followers. Only they will see this story, with a green “Close friends” label.</p>
                {cfPeople === null && <p className="text-white/60 py-4">Loading followers…</p>}
                {cfPeople && cfPeople.length === 0 && <p className="text-white/60 py-4">You have no followers yet. Share your stories normally for now.</p>}
                {cfPeople?.map((p) => {
                  const on = cfIds.includes(p.uid);
                  return (
                    <button key={p.uid} onClick={() => toggleClose(p.uid)} className="w-full flex items-center gap-3 py-2 text-left">
                      <span className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">{p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : "👤"}</span>
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${on ? "bg-green-500 border-green-500" : "border-white/40"}`}>{on ? "✓" : ""}</span>
                    </button>
                  );
                })}
                <button disabled={!cfIds.length || busy} onClick={() => { setPanel(null); publish(true); }} className="w-full mt-4 rounded-xl bg-green-600 py-3 font-semibold disabled:opacity-40">
                  {cfIds.length ? `Share with ${cfIds.length} close friend${cfIds.length > 1 ? "s" : ""}` : "Select at least one person"}
                </button>
              </>
            )}

            {panel === "text" && (
              <>
                <textarea
                  autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={120} rows={2}
                  placeholder="Type something…" className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none mb-3"
                />
                <div className="flex gap-2 overflow-x-auto mb-3">
                  {TEXT_STYLES.map((s) => (
                    <button key={s.key} onClick={() => setTStyle(s.key)} className={`px-4 py-2 rounded-full whitespace-nowrap border ${tStyle === s.key ? "bg-white text-black border-white" : "border-white/30"}`}>{s.label}</button>
                  ))}
                </div>
                <div className="flex gap-3 mb-4">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setTColor(c)} aria-label={c} className={`w-8 h-8 rounded-full border-2 ${tColor === c ? "border-white" : "border-transparent"}`} style={{ background: c, outline: "1px solid rgba(255,255,255,.3)" }} />
                  ))}
                </div>
                <button disabled={!text.trim()} onClick={() => { add({ kind: "text", text: text.trim(), style: tStyle, color: tColor }); setText(""); }} className="w-full rounded-xl bg-white text-black py-3 font-semibold disabled:opacity-40">Add text</button>
              </>
            )}

            {panel === "sticker" && (
              <>
                <p className="font-semibold mb-3">Islamic stickers</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {STICKERS.map((s, i) => {
                    const o: Overlay = { id: "x", kind: "sticker", text: s.text, style: s.style, color: "#fff", x: 0, y: 0, scale: 0.5 };
                    const st = overlayStyle(o);
                    return (
                      <button key={i} onClick={() => add({ kind: "sticker", text: s.text, style: s.style, color: "#ffffff" })} className="flex flex-col items-center gap-1 bg-white/5 rounded-xl p-3 min-w-[28%]">
                        <span className={st.className} style={{ ...st.style, fontSize: s.style === "emoji" ? 36 : s.style === "gold" ? 22 : 14, maxWidth: 140 }}>{s.text}</span>
                        {s.sub && <span className="text-[11px] text-white/60">{s.sub}</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {panel === "mention" && (
              <>
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name" className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none mb-3" />
                {(q.trim() ? results : people).map((p) => (
                  <button key={p.uid} onClick={() => add({ kind: "mention", text: p.name, style: "mention", color: "#7c3aed", uid: p.uid })} className="w-full flex items-center gap-3 py-2 text-left">
                    <span className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                      {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : "👤"}
                    </span>
                    <span className="font-semibold">{p.name}</span>
                  </button>
                ))}
                {(q.trim() ? results : people).length === 0 && <p className="text-white/60 text-sm">{q.trim() ? "No one found." : "People you follow appear here. Or search a name."}</p>}
              </>
            )}

            {panel === "music" && (
              <>
                <p className="font-semibold mb-1">Naat Sharif</p>
                <p className="text-xs text-white/60 mb-3">Tracks added to the app library, or use your own audio.</p>
                {naats === null && <p className="text-white/60">Loading…</p>}
                {naats && naats.length === 0 && <p className="text-white/60 text-sm mb-3">The library is empty for now.</p>}
                {naats?.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 py-2 border-b border-white/10">
                    <button onClick={() => playPreview(n)} className="w-10 h-10 rounded-full bg-white/10">{preview === n.id ? "⏸" : "▶"}</button>
                    <div className="flex-1 min-w-0"><p className="font-semibold truncate">{n.title}</p><p className="text-xs text-white/60 truncate">{n.artist}</p></div>
                    <button onClick={() => { setAudio({ title: `${n.title} · ${n.artist}`, url: n.url }); setPanel(null); }} className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-semibold">Use</button>
                  </div>
                ))}
                <label className="block mt-4 rounded-xl border border-dashed border-white/30 py-3 text-center cursor-pointer">
                  🎙 Use my own audio file
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudio({ title: f.name.replace(/\.[^.]+$/, ""), file: f }); setPanel(null); } }} />
                </label>
                <p className="text-xs text-white/50 mt-2">Only use audio you have the right to share.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
