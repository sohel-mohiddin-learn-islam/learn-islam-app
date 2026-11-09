import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from "lucide-react";
import { joinGroupCall, watchGroupCall, type GSession } from "@/lib/groupcall";
import type { CallType } from "@/lib/call";
import { getProfile, type UserProfile } from "@/lib/social";

function Tile({ stream, name, photo, video, self }: { stream: MediaStream | null; name: string; photo?: string | null; video: boolean; self?: boolean }) {
  const v = useRef<HTMLVideoElement>(null);
  const a = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (v.current) v.current.srcObject = stream;
    if (a.current && !self) a.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative bg-neutral-800 rounded-2xl overflow-hidden flex items-center justify-center min-h-[120px]">
      {!self && <audio ref={a} autoPlay playsInline />}
      {video && <video ref={v} autoPlay playsInline muted={self} className="absolute inset-0 w-full h-full object-cover" />}
      {!video && (
        <span className="w-20 h-20 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-3xl">
          {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : "👤"}
        </span>
      )}
      <span className="absolute left-2 bottom-2 text-xs bg-black/50 rounded-full px-2 py-0.5">{self ? "You" : name}</span>
    </div>
  );
}

export default function GroupCallScreen({ callId, me, type, onDone }: { callId: string; me: string; type: CallType; onDone: () => void }) {
  const [streams, setStreams] = useState<Record<string, MediaStream>>({});
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [active, setActive] = useState<string[]>([]);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [err, setErr] = useState("");
  const [secs, setSecs] = useState(0);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const session = useRef<GSession | null>(null);
  const left = useRef(false);

  const leave = async () => {
    if (left.current) return;
    left.current = true;
    await session.current?.leave();
    onDone();
  };

  useEffect(() => {
    let alive = true;
    joinGroupCall(
      callId, me, type,
      (uid, s) => setStreams((o) => ({ ...o, [uid]: s })),
      (uid) => setStreams((o) => { const c = { ...o }; delete c[uid]; return c; }),
    )
      .then((s) => { if (!alive) { s.leave(); return; } session.current = s; setLocal(s.local); })
      .catch((e) => { setErr(e?.message || "Could not join. Allow microphone/camera and try again."); setTimeout(onDone, 2500); });
    const stop = watchGroupCall(callId, (c) => {
      if (!c || c.status === "ended") { leave(); return; }
      setActive(c.active);
      c.active.forEach((u) => getProfile(u).then((p) => setProfiles((o) => (o[u] ? o : { ...o, [u]: p }))).catch(() => {}));
    });
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => { alive = false; stop(); clearInterval(t); session.current?.leave(); };
  }, []);

  const others = active.filter((u) => u !== me);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const video = type === "video";
  const Btn = ({ onClick, children, red }: { onClick: () => void; children: any; red?: boolean }) => (
    <button onClick={onClick} className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${red ? "bg-red-600" : "bg-white/20"}`}>{children}</button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      <p className="text-center pt-8 text-sm opacity-80">{err || `Group ${type} call · ${others.length + 1} in call · ${mm}:${ss}`}</p>
      <div className={`flex-1 grid gap-2 p-3 ${others.length >= 2 ? "grid-cols-2" : "grid-cols-1"} auto-rows-fr`}>
        <Tile stream={local} name="You" video={video && camOn} self />
        {others.map((u) => (
          <Tile key={u} stream={streams[u] || null} name={profiles[u]?.displayName || "…"} photo={profiles[u]?.photoURL} video={video && !!streams[u]} />
        ))}
      </div>
      <div className="flex justify-center gap-5 pb-10 pt-3">
        <Btn onClick={() => { const m = !muted; setMuted(m); session.current?.setMuted(m); }}>{muted ? <MicOff /> : <Mic />}</Btn>
        {video && <Btn onClick={() => { const c = !camOn; setCamOn(c); session.current?.setCamera(c); }}>{camOn ? <Video /> : <VideoOff />}</Btn>}
        {video && <Btn onClick={() => session.current?.flip()}><RefreshCw /></Btn>}
        <Btn red onClick={leave}><PhoneOff /></Btn>
      </div>
    </div>
  );
}
