import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Mic, MicOff, Phone, PhoneOff, RefreshCw, Video, VideoOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { getProfile, type UserProfile } from "@/lib/social";
import { connect, createCall, logMissed, setCallStatus, watchCall, type CallDoc, type CallType, type Session } from "@/lib/call";

type Active = { id: string; role: "caller" | "callee"; type: CallType; other: string };

/** Anywhere in the app: window.dispatchEvent(new CustomEvent("start-call", { detail: { other, type } })) */
export function startCall(other: string, type: CallType) {
  window.dispatchEvent(new CustomEvent("start-call", { detail: { other, type } }));
}

function ring(on: boolean, ref: { current: any }) {
  try {
    if (!on) { ref.current?.stop?.(); ref.current = null; return; }
    if (ref.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    osc.connect(gain); gain.connect(ctx.destination);
    let t = 0;
    const id = setInterval(() => { gain.gain.value = t++ % 4 < 2 ? 0.15 : 0; navigator.vibrate?.(t % 4 < 2 ? 300 : 0); }, 500);
    osc.start();
    ref.current = { stop: () => { clearInterval(id); osc.stop(); ctx.close(); } };
  } catch { /* no sound */ }
}

function CallScreen({ active, me, onDone }: { active: Active; me: string; onDone: () => void }) {
  const [other, setOther] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<CallDoc["status"]>(active.role === "caller" ? "ringing" : "active");
  const [conn, setConn] = useState("connecting");
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState("");
  const session = useRef<Session | null>(null);
  const localV = useRef<HTMLVideoElement>(null);
  const remoteV = useRef<HTMLVideoElement>(null);
  const remoteA = useRef<HTMLAudioElement>(null);
  const done = useRef(false);
  const ringRef = useRef<any>(null);

  const finish = (s?: CallDoc["status"]) => {
    if (done.current) return;
    done.current = true;
    ring(false, ringRef);
    session.current?.close();
    if (s) setCallStatus(active.id, s);
    setTimeout(onDone, 600);
  };

  useEffect(() => { getProfile(active.other).then(setOther).catch(() => {}); }, []);

  const start = async () => {
    try {
      session.current = await connect(
        active.id, active.role, active.type,
        (stream) => { if (remoteV.current) remoteV.current.srcObject = stream; if (remoteA.current) remoteA.current.srcObject = stream; },
        setConn,
      );
      if (localV.current) localV.current.srcObject = session.current.local;
    } catch {
      setErr("Could not use the microphone/camera. Allow permission and try again.");
      finish("ended");
    }
  };

  useEffect(() => {
    // callee connects on accept (this component mounts after accept); caller connects straight away
    start();
    const stop = watchCall(active.id, (c) => {
      if (!c) return finish();
      setStatus(c.status);
      if (c.status === "ended" || c.status === "declined" || c.status === "missed") finish();
    });
    return () => { stop(); ring(false, ringRef); session.current?.close(); };
  }, []);

  useEffect(() => {
    if (active.role === "caller") ring(status === "ringing", ringRef);
    if (status !== "active") return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // caller gives up after 45 s
  useEffect(() => {
    if (active.role !== "caller") return;
    const id = setTimeout(() => {
      if (status === "ringing") { logMissed(me, active.other, active.type); finish("missed"); }
    }, 45000);
    return () => clearTimeout(id);
  }, [status]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const label = err || (status === "ringing" ? "Ringing…" : status === "active" ? (conn === "connected" ? `${mm}:${ss}` : "Connecting…") : "Call ended");
  const video = active.type === "video";

  const Btn = ({ onClick, children, red }: { onClick: () => void; children: any; red?: boolean }) => (
    <button onClick={onClick} className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${red ? "bg-red-600" : "bg-white/20"}`}>{children}</button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      <audio ref={remoteA} autoPlay playsInline />
      {video && <video ref={remoteV} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />}
      {video && <video ref={localV} autoPlay playsInline muted className="absolute top-14 right-4 w-28 h-40 rounded-xl object-cover border border-white/30 z-10 bg-black" />}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-24 text-center drop-shadow">
        {(!video || status !== "active") && (
          <span className="w-28 h-28 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-5xl mb-4">
            {other?.photoURL ? <img src={other.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
          </span>
        )}
        <p className="text-2xl font-semibold">{other?.displayName || "…"}</p>
        <p className="opacity-80 mt-1">{video ? "Video call · " : "Voice call · "}{label}</p>
      </div>
      <div className="relative z-10 flex justify-center gap-5 pb-12 pt-6 bg-gradient-to-t from-black/70 to-transparent">
        <Btn onClick={() => { const m = !muted; setMuted(m); session.current?.setMuted(m); }}>{muted ? <MicOff /> : <Mic />}</Btn>
        {video && <Btn onClick={() => { const c = !camOn; setCamOn(c); session.current?.setCamera(c); }}>{camOn ? <Video /> : <VideoOff />}</Btn>}
        {video && <Btn onClick={() => session.current?.flip()}><RefreshCw /></Btn>}
        <Btn red onClick={() => finish("ended")}><PhoneOff /></Btn>
      </div>
    </div>
  );
}

export default function CallManager() {
  const { user } = useAuth();
  const [active, setActive] = useState<Active | null>(null);
  const [incoming, setIncoming] = useState<CallDoc | null>(null);
  const [caller, setCaller] = useState<UserProfile | null>(null);
  const ringRef = useRef<any>(null);

  // someone is calling me
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, "calls"), where("callee", "==", user.uid), where("status", "==", "ringing")),
      (snap) => {
        const fresh = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as any)).filter((c) => Date.now() - (c.startedAt || 0) < 50000);
        setIncoming(fresh[0] || null);
      },
      () => {},
    );
  }, [user?.uid]);

  useEffect(() => {
    if (incoming && !active) { getProfile(incoming.caller).then(setCaller).catch(() => {}); ring(true, ringRef); }
    else ring(false, ringRef);
    return () => ring(false, ringRef);
  }, [incoming?.id, !!active]);

  // I start a call
  useEffect(() => {
    if (!user) return;
    const h = async (e: any) => {
      if (active) return;
      try {
        const id = await createCall(user.uid, e.detail.other, e.detail.type);
        setActive({ id, role: "caller", type: e.detail.type, other: e.detail.other });
      } catch (err: any) {
        alert(err?.message || "Could not start the call.");
      }
    };
    window.addEventListener("start-call", h);
    return () => window.removeEventListener("start-call", h);
  }, [user?.uid, !!active]);

  if (!user) return null;
  if (active) return <CallScreen active={active} me={user.uid} onDone={() => setActive(null)} />;
  if (!incoming) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 text-white flex flex-col items-center pt-28">
      <span className="w-28 h-28 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-5xl mb-4">
        {caller?.photoURL ? <img src={caller.photoURL} alt="" className="w-full h-full object-cover" /> : "👤"}
      </span>
      <p className="text-2xl font-semibold">{caller?.displayName || "Someone"}</p>
      <p className="opacity-80 mt-1">Incoming {incoming.type === "video" ? "video" : "voice"} call…</p>
      <div className="mt-auto mb-24 flex gap-16">
        <button onClick={() => setCallStatus(incoming.id, "declined")} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center"><PhoneOff /></button>
        <button
          onClick={() => setActive({ id: incoming.id, role: "callee", type: incoming.type, other: incoming.caller })}
          className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center"
        >
          {incoming.type === "video" ? <Video /> : <Phone />}
        </button>
      </div>
    </div>
  );
}
