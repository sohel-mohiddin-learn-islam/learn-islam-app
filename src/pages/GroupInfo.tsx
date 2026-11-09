import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Bell, BellOff, Phone, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DISAPPEAR_OPTIONS, FONTS, THEMES } from "@/lib/chat";
import { addMembers, leaveGroup, makeAdmin, removeMember, updateGroup, watchGroup, type Group } from "@/lib/groups";
import { getFollowerIds, getFollowingIds, getProfile, uploadImage, type UserProfile } from "@/lib/social";
import { startGroupCall } from "@/components/CallManager";

type P = { uid: string; name: string; photo: string | null };

export default function GroupInfo() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/group/:gid/info");
  const gid = params?.gid || "";
  const [g, setG] = useState<Group | null | undefined>(undefined);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [candidates, setCandidates] = useState<P[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [panel, setPanel] = useState<"" | "customize" | "disappear">("");
  const [msg, setMsg] = useState("");

  useEffect(() => watchGroup(gid, (x) => { setG(x); if (x) setName((n) => n || x.name); }), [gid]);
  useEffect(() => {
    g?.members.forEach((m) => { if (!profiles[m]) getProfile(m).then((p) => setProfiles((o) => ({ ...o, [m]: p }))).catch(() => {}); });
  }, [g?.members.join(",")]);

  useEffect(() => {
    if (!adding || !user || !g) return;
    (async () => {
      const ids = Array.from(new Set([...(await getFollowingIds(user.uid).catch(() => [])), ...(await getFollowerIds(user.uid).catch(() => []))])).filter((i) => !g.members.includes(i));
      const list = await Promise.all(ids.slice(0, 80).map((id) => getProfile(id).then((p) => ({ uid: id, name: p.displayName, photo: p.photoURL })).catch(() => null)));
      setCandidates(list.filter(Boolean) as P[]);
    })();
  }, [adding]);

  const me = user?.uid || "";
  const isAdmin = !!g && g.admins.includes(me);
  const run = (p: Promise<any>) => p.catch(() => setMsg("Could not save. Only admins can do that."));
  const dispName = useMemo(() => (u: string) => profiles[u]?.displayName || "…", [profiles]);

  if (!user) { setLocation("/login"); return null; }
  if (g === undefined) return <p className="p-6">Loading…</p>;
  if (g === null) return <p className="p-6">This group is not available.</p>;
  const muted = !!g.muted[me];

  const back = () => (panel ? setPanel("") : adding ? setAdding(false) : setLocation(`/group/${gid}`));

  const setPhoto = async (f?: File) => {
    if (!f) return;
    try { const url = await uploadImage(f); await updateGroup(gid, { photo: url }); } catch { setMsg("Could not upload the photo."); }
  };

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground font-sans pb-10">
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={back} aria-label="Back"><ArrowLeft /></button>
        <span className="font-semibold text-lg">{adding ? "Add people" : panel === "customize" ? "Customize" : panel === "disappear" ? "Disappearing messages" : "Group details"}</span>
      </div>

      {!panel && !adding && (
        <>
          <div className="flex flex-col items-center">
            <label className={`w-28 h-28 rounded-full bg-muted overflow-hidden flex items-center justify-center text-4xl ${isAdmin ? "cursor-pointer" : ""}`}>
              {g.photo ? <img src={g.photo} alt="" className="w-full h-full object-cover" /> : "👥"}
              {isAdmin && <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0])} />}
            </label>
            {isAdmin && <p className="text-xs text-foreground/50 mt-1">Tap the picture to change it</p>}
            {isAdmin ? (
              <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== g.name && run(updateGroup(gid, { name: name.trim().slice(0, 40) }))}
                maxLength={40} className="text-2xl font-semibold text-center bg-transparent outline-none mt-3 border-b border-transparent focus:border-primary" />
            ) : <p className="text-2xl font-semibold mt-3">{g.name}</p>}
            <p className="text-sm text-foreground/60">{g.members.length} members</p>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center text-sm font-semibold my-6 px-6">
            <button onClick={() => startGroupCall(gid, "audio")} className="flex flex-col items-center gap-1"><Phone />Voice call</button>
            <button onClick={() => startGroupCall(gid, "video")} className="flex flex-col items-center gap-1"><Video />Video call</button>
            <button onClick={() => run(updateGroup(gid, { [`muted.${me}`]: !muted }))} className="flex flex-col items-center gap-1">{muted ? <BellOff /> : <Bell />}{muted ? "Unmute" : "Mute"}</button>
          </div>

          <button onClick={() => setPanel("customize")} className="w-full text-left px-5 py-3.5 font-semibold">🎨 Customize <span className="block font-normal text-sm text-foreground/60">Theme and font</span></button>
          <button onClick={() => setPanel("disappear")} className="w-full text-left px-5 py-3.5 font-semibold">⏱ Disappearing messages <span className="block font-normal text-sm text-foreground/60">{g.disappear ? DISAPPEAR_OPTIONS.find((o) => o[1] === g.disappear)?.[0] : "Off"}</span></button>
          <button onClick={() => { if (confirm("Delete this chat for you?")) { run(updateGroup(gid, { [`clearedAt.${me}`]: Date.now() })); setLocation(`/group/${gid}`); } }} className="w-full text-left px-5 py-3.5 font-semibold">🧹 Clear chat for me</button>

          <div className="flex items-center justify-between px-5 mt-4 mb-1">
            <h3 className="font-bold">Members</h3>
            {isAdmin && <button onClick={() => { setPicked([]); setAdding(true); }} className="text-primary font-semibold">+ Add</button>}
          </div>
          {g.members.map((m) => (
            <div key={m} className="flex items-center gap-3 px-5 py-2">
              <button onClick={() => setLocation(`/user/${m}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <span className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">{profiles[m]?.photoURL ? <img src={profiles[m].photoURL!} alt="" className="w-full h-full object-cover" /> : "👤"}</span>
                <span className="truncate">{m === me ? "You" : dispName(m)}{g.admins.includes(m) && <span className="ml-2 text-xs text-primary">Admin</span>}</span>
              </button>
              {isAdmin && m !== me && (
                <span className="flex gap-3 text-sm">
                  {!g.admins.includes(m) && <button onClick={() => run(makeAdmin(gid, m))} className="text-primary">Make admin</button>}
                  <button onClick={() => run(removeMember(gid, m))} className="text-red-500">Remove</button>
                </span>
              )}
            </div>
          ))}
          {msg && <p className="px-5 mt-2 text-sm text-red-500">{msg}</p>}
          <button onClick={async () => { if (confirm("Leave this group?")) { await leaveGroup(me, gid).catch(() => {}); setLocation("/messages"); } }} className="w-full text-left px-5 py-4 mt-4 text-red-500 font-semibold">Leave group</button>
        </>
      )}

      {panel === "customize" && (
        <div className="px-5 space-y-6">
          <div className="flex flex-wrap gap-3">
            {Object.entries(THEMES).map(([k, t]) => (
              <button key={k} onClick={() => run(updateGroup(gid, { theme: k }))} className="flex flex-col items-center gap-1 text-xs">
                <span className={`w-11 h-11 rounded-full border-2 ${g.theme === k ? "border-foreground" : "border-transparent"}`} style={{ background: t.bubble || "hsl(var(--primary))" }} />{t.name}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {Object.entries(FONTS).map(([k, f]) => (
              <button key={k} onClick={() => run(updateGroup(gid, { font: k }))} style={f.css ? { fontFamily: f.css } : undefined}
                className={`w-full text-left px-4 py-3 rounded-xl border ${g.font === k ? "border-primary bg-primary/10" : "border-border"}`}>{f.name} — Assalamu alaikum</button>
            ))}
          </div>
        </div>
      )}

      {panel === "disappear" && (
        <div className="px-5 space-y-2">
          {DISAPPEAR_OPTIONS.map(([label, secs]) => (
            <button key={label} onClick={() => run(updateGroup(gid, { disappear: secs }))} className={`w-full text-left px-4 py-3 rounded-xl border ${g.disappear === secs ? "border-primary bg-primary/10" : "border-border"}`}>{label}</button>
          ))}
        </div>
      )}

      {adding && (
        <div>
          {candidates.length === 0 && <p className="px-5 text-foreground/60">Nobody else to add. Follow more people first.</p>}
          {candidates.map((p) => {
            const on = picked.includes(p.uid);
            return (
              <button key={p.uid} onClick={() => setPicked((a) => (on ? a.filter((x) => x !== p.uid) : [...a, p.uid]))} className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-muted">
                <span className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">{p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : "👤"}</span>
                <span className="flex-1">{p.name}</span><span>{on ? "✓" : ""}</span>
              </button>
            );
          })}
          <button disabled={!picked.length} onClick={async () => { await run(addMembers(gid, picked)); setAdding(false); }} className="mx-5 mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40">Add {picked.length || ""}</button>
        </div>
      )}
    </div>
  );
}
