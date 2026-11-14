import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AvatarArt, { BGS, COLORS, DEFAULT_AVATAR, HAIRS, SKINS, type AvatarCfg } from "@/components/AvatarArt";

const Swatches = ({ list, value, onPick }: { list: string[]; value: string; onPick: (c: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {list.map((c) => (
      <button key={c} onClick={() => onPick(c)} aria-label={c} style={{ background: c }} className={`w-8 h-8 rounded-full border ${value === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"}`} />
    ))}
  </div>
);
const Chips = <T extends string>({ list, value, onPick }: { list: [T, string][]; value: T; onPick: (v: T) => void }) => (
  <div className="flex flex-wrap gap-2">
    {list.map(([v, l]) => (
      <button key={v} onClick={() => onPick(v)} className={`px-3 py-1.5 rounded-full text-sm border ${value === v ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{l}</button>
    ))}
  </div>
);

export default function AvatarMaker({ uid, initial, onClose, onSaved }: { uid: string; initial?: AvatarCfg | null; onClose: () => void; onSaved: (c: AvatarCfg | null) => void }) {
  const [cfg, setCfg] = useState<AvatarCfg>({ ...DEFAULT_AVATAR, ...(initial || {}) });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (p: Partial<AvatarCfg>) => setCfg((c) => ({ ...c, ...p }));
  const woman = cfg.wear === "hijab" || cfg.wear === "niqab";

  const save = async (value: AvatarCfg | null) => {
    setBusy(true); setErr("");
    try {
      await setDoc(doc(db, "users", uid), { avatarArt: value }, { merge: true });
      onSaved(value); onClose();
    } catch { setErr("Could not save your avatar. Check your internet and try again."); }
    setBusy(false);
  };

  const H = ({ t }: { t: string }) => <p className="text-xs uppercase text-foreground/60 mt-4 mb-2">{t}</p>;

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto font-sans" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-background px-5 pt-4 pb-3 flex flex-col items-center border-b border-border">
          <div className="flex w-full items-center justify-between mb-2">
            <button onClick={onClose} aria-label="Close" className="text-xl">✕</button>
            <p className="font-semibold">Create your avatar</p>
            <button onClick={() => save(cfg)} disabled={busy} className="text-primary font-semibold disabled:opacity-50">{busy ? "Saving…" : "Done"}</button>
          </div>
          <AvatarArt cfg={cfg} size={150} wave />
        </div>
        <div className="px-5 pb-8">
          <H t="Skin" /><Swatches list={SKINS} value={cfg.skin} onPick={(c) => set({ skin: c })} />
          <H t="Head wear" />
          <Chips list={[["kufi", "Kufi"], ["turban", "Turban"], ["shemagh", "Shemagh"], ["hijab", "Hijab"], ["niqab", "Niqab"], ["none", "None"]]} value={cfg.wear} onPick={(v) => set({ wear: v })} />
          {cfg.wear !== "none" && <><H t="Head wear colour" /><Swatches list={COLORS} value={cfg.wearColor} onPick={(c) => set({ wearColor: c })} /></>}
          {!woman && (
            <>
              <H t="Hair" />
              <Chips list={[["short", "Short"], ["curly", "Curly"], ["none", "None"]]} value={cfg.hairStyle} onPick={(v) => set({ hairStyle: v })} />
              <div className="mt-2"><Swatches list={HAIRS} value={cfg.hair} onPick={(c) => set({ hair: c })} /></div>
              <H t="Beard" />
              <Chips list={[["none", "None"], ["short", "Short"], ["full", "Full"]]} value={cfg.beard} onPick={(v) => set({ beard: v })} />
            </>
          )}
          <H t="Glasses" />
          <Chips list={[["no", "No"], ["yes", "Yes"]]} value={cfg.glasses ? "yes" : "no"} onPick={(v) => set({ glasses: v === "yes" })} />
          <H t="Clothes" /><Swatches list={COLORS.filter((c) => c !== "#ffffff")} value={cfg.outfit} onPick={(c) => set({ outfit: c })} />
          <H t="Background" /><Swatches list={BGS} value={cfg.bg} onPick={(c) => set({ bg: c })} />
          {err && <p className="text-red-500 text-sm mt-3">{err}</p>}
          {initial && <button onClick={() => save(null)} disabled={busy} className="mt-6 w-full rounded-xl bg-muted py-3 font-semibold">Remove avatar</button>}
        </div>
      </div>
    </div>
  );
}
