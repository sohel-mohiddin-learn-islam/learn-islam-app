import {
  addDoc, collection, doc, onSnapshot, updateDoc, serverTimestamp, type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { notify } from "./notifications";
import { assertCanMessage, sendMessage } from "./chat";

export type CallType = "audio" | "video";
export type CallStatus = "ringing" | "active" | "ended" | "declined" | "missed";
export type CallDoc = { id: string; caller: string; callee: string; type: CallType; status: CallStatus; offer?: any; answer?: any };

const WORKER = ((import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined) || "").replace(/\/$/, "");
const STUN: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

async function iceServers(): Promise<RTCIceServer[]> {
  if (!WORKER || !auth.currentUser) return STUN;
  try {
    const t = await auth.currentUser.getIdToken();
    const r = await fetch(`${WORKER}/turn`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json();
    const s = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
    return [...STUN, ...s];
  } catch {
    return STUN;
  }
}

/** Creates the call document and wakes the other phone. */
export async function createCall(me: string, other: string, type: CallType): Promise<string> {
  await assertCanMessage(me, other);
  const ref = await addDoc(collection(db, "calls"), {
    caller: me, callee: other, type, status: "ringing", createdAt: serverTimestamp(), startedAt: Date.now(),
  });
  // shows in their notifications + phone alert (push wakes the phone when the app is closed)
  notify(other, me, "message", { text: type === "video" ? "📹 Incoming video call" : "📞 Incoming voice call", key: `call_${ref.id}` });
  return ref.id;
}

export function watchCall(id: string, cb: (c: CallDoc | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "calls", id), (d) => cb(d.exists() ? ({ id: d.id, ...(d.data() as any) } as CallDoc) : null), () => cb(null));
}

export const setCallStatus = (id: string, status: CallStatus) => updateDoc(doc(db, "calls", id), { status, endedAt: Date.now() }).catch(() => {});

export async function logMissed(me: string, other: string, type: CallType) {
  await sendMessage(me, other, type === "video" ? "📹 Missed video call" : "📞 Missed voice call").catch(() => {});
}

export type Session = { local: MediaStream; remote: MediaStream; setMuted: (m: boolean) => void; setCamera: (on: boolean) => void; flip: () => Promise<void>; close: () => void };

/** Runs the WebRTC side of a call. `role` caller makes the offer, callee answers. */
export async function connect(
  callId: string, role: "caller" | "callee", type: CallType,
  onRemote: (s: MediaStream) => void, onState: (s: RTCPeerConnectionState) => void,
): Promise<Session> {
  let facing: "user" | "environment" = "user";
  const getMedia = (f: "user" | "environment") =>
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: type === "video" ? { facingMode: f } : false });
  const local = await getMedia(facing);
  const pc = new RTCPeerConnection({ iceServers: await iceServers() });
  const remote = new MediaStream();
  local.getTracks().forEach((t) => pc.addTrack(t, local));
  pc.ontrack = (e) => { e.streams[0]?.getTracks().forEach((t) => remote.addTrack(t)); onRemote(remote); };
  pc.onconnectionstatechange = () => onState(pc.connectionState);

  const callRef = doc(db, "calls", callId);
  const mine = collection(callRef, role === "caller" ? "callerCandidates" : "calleeCandidates");
  const theirs = collection(callRef, role === "caller" ? "calleeCandidates" : "callerCandidates");
  pc.onicecandidate = (e) => { if (e.candidate) addDoc(mine, e.candidate.toJSON()).catch(() => {}); };
  const unsubs: Unsubscribe[] = [];
  unsubs.push(onSnapshot(theirs, (snap) => snap.docChanges().forEach((c) => {
    if (c.type === "added") pc.addIceCandidate(new RTCIceCandidate(c.doc.data() as any)).catch(() => {});
  })));

  if (role === "caller") {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await updateDoc(callRef, { offer: { type: offer.type, sdp: offer.sdp } });
    unsubs.push(onSnapshot(callRef, (d) => {
      const a = (d.data() as any)?.answer;
      if (a && !pc.currentRemoteDescription) pc.setRemoteDescription(new RTCSessionDescription(a)).catch(() => {});
    }));
  } else {
    // the caller uploads the offer a moment after ringing starts: wait for it
    const offer = await new Promise<any>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error("no offer")), 20000);
      const u = onSnapshot(callRef, (d) => {
        const o = (d.data() as any)?.offer;
        if (o) { clearTimeout(to); u(); resolve(o); }
      });
    });
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await updateDoc(callRef, { answer: { type: answer.type, sdp: answer.sdp }, status: "active" });
  }

  return {
    local, remote,
    setMuted: (m) => local.getAudioTracks().forEach((t) => (t.enabled = !m)),
    setCamera: (on) => local.getVideoTracks().forEach((t) => (t.enabled = on)),
    flip: async () => {
      if (type !== "video") return;
      facing = facing === "user" ? "environment" : "user";
      const s = await getMedia(facing);
      const nt = s.getVideoTracks()[0];
      const sender = pc.getSenders().find((x) => x.track?.kind === "video");
      await sender?.replaceTrack(nt);
      local.getVideoTracks().forEach((t) => { t.stop(); local.removeTrack(t); });
      local.addTrack(nt);
    },
    close: () => { unsubs.forEach((u) => u()); local.getTracks().forEach((t) => t.stop()); pc.close(); },
  };
}
