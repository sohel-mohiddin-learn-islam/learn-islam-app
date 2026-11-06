import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createHighlight, deleteHighlight, getHighlights, type Highlight } from "@/lib/highlights";
import { getStoryArchive, type Story } from "@/lib/stories";
import { useBackClose } from "@/lib/backButton";
import StoryViewer from "./StoryViewer";

function Picker({ owner, onClose, onCreated }: { owner: string; onClose: () => void; onCreated: () => void }) {
  useBackClose(onClose);
  const [stories, setStories] = useState<Story[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStoryArchive(owner).then(setStories).catch(() => setStories([]));
  }, [owner]);

  const chosen = (stories || []).filter((s) => sel.includes(s.id)).sort((a, b) => a.createdAt - b.createdAt);

  const save = async () => {
    setBusy(true);
    await createHighlight(owner, title, chosen).catch(() => {});
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-background text-foreground flex flex-col font-sans">
      <div className="flex items-center gap-4 px-4 py-4">
        <button onClick={step === 2 ? () => setStep(1) : onClose} className="text-2xl" aria-label="Back">←</button>
        <h2 className="font-semibold text-lg flex-1">{step === 1 ? "New highlight" : "Name your highlight"}</h2>
        {step === 1 && (
          <button disabled={sel.length === 0} onClick={() => setStep(2)} className="text-primary font-semibold disabled:opacity-40">Next</button>
        )}
      </div>

      {step === 1 && (
        <div className="flex-1 overflow-y-auto">
          {stories === null && <p className="p-6 text-foreground/60">Loading your stories…</p>}
          {stories && stories.length === 0 && <p className="p-6 text-foreground/60">No stories yet. Post a story first, then add it to a highlight.</p>}
          <div className="grid grid-cols-3 gap-0.5">
            {stories?.map((s) => (
              <button key={s.id} onClick={() => setSel((x) => (x.includes(s.id) ? x.filter((i) => i !== s.id) : [...x, s.id]))} className="relative aspect-[9/16] bg-muted overflow-hidden">
                {s.type === "image" ? (
                  <img src={s.mediaUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={`${s.mediaUrl}#t=0.5`} preload="metadata" muted playsInline className="w-full h-full object-cover" />
                )}
                <span className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs ${sel.includes(s.id) ? "bg-blue-500" : "bg-black/30"}`}>
                  {sel.includes(s.id) ? "✓" : ""}
                </span>
                <span className="absolute bottom-1 left-1 text-[10px] text-white drop-shadow">{new Date(s.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-muted overflow-hidden flex items-center justify-center">
            {chosen[0]?.type === "image" ? <img src={chosen[0].mediaUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">🎬</span>}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={20} placeholder="Highlights" className="w-full text-center rounded-lg bg-muted px-3 py-3" />
          <button disabled={busy} onClick={save} className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-60">
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Highlights circles under the profile header. The owner also gets a "New" button. */
export default function HighlightsRow({ owner, isOwn, ownerName, locked }: { owner: string; isOwn: boolean; ownerName: string; locked: boolean }) {
  const { user } = useAuth();
  const [list, setList] = useState<Highlight[]>([]);
  const [open, setOpen] = useState<Highlight | null>(null);
  const [picker, setPicker] = useState(false);

  const load = () => (locked ? setList([]) : getHighlights(owner).then(setList));
  useEffect(() => {
    load();
  }, [owner, locked]);

  if (!isOwn && list.length === 0) return null;

  return (
    <>
      <div className="mt-5 flex gap-4 overflow-x-auto">
        {isOwn && (
          <button onClick={() => setPicker(true)} className="flex flex-col items-center gap-1 shrink-0 w-[72px]">
            <span className="w-16 h-16 rounded-full border border-border flex items-center justify-center text-3xl">＋</span>
            <span className="text-xs">New</span>
          </button>
        )}
        {list.map((h) => (
          <button key={h.id} onClick={() => setOpen(h)} className="flex flex-col items-center gap-1 shrink-0 w-[72px]">
            <span className="w-16 h-16 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center">
              {h.cover ? <img src={h.cover} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🎬</span>}
            </span>
            <span className="text-xs truncate w-full text-center">{h.title}</span>
          </button>
        ))}
      </div>

      {open && (
        <StoryViewer
          ownerName={`${ownerName} · ${open.title}`}
          readOnly
          stories={open.items.map((it, i) => ({
            id: `${open.id}-${i}`, ownerId: owner, mediaUrl: it.mediaUrl, type: it.type, caption: it.caption,
            createdAt: 0, expiresAt: Number.MAX_SAFE_INTEGER, closeOnly: false,
          }))}
          onClose={() => setOpen(null)}
          onDeleteAll={isOwn && user ? () => deleteHighlight(owner, open.id).then(load).catch(() => {}) : undefined}
        />
      )}
      {picker && <Picker owner={owner} onClose={() => setPicker(false)} onCreated={() => { setPicker(false); load(); }} />}
    </>
  );
}
