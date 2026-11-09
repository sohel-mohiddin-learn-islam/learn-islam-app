import {
  addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where, serverTimestamp, type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { notify } from "./notifications";
import { MAX_CALL, type Group } from "./groups";
import type { CallType } from "./call";

export type GCall = { id: string; gid: string; type: CallType; host: string; members: string[]; active: string[]; status: "live" | "ended"; startedAt: number };

const WORKER = ((import.meta.env.VITE_AI_TUTOR_ENDPOINT as string | undefined) || "").replace(/\/$/, "");
const STUN: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
async function iceServers(): Promise<RTCIceServer[]> {
  if (!WORKER || !auth.currentUser) return STUN;
  try {
    const t = await auth.currentUser.getIdToken();
    const j = await (await fetch(`${WORKER}/turn`, { method: "POST", headers: { Authorization: `Bearer ${t}` } })).json();
    const s = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
    return [...STUN, ...s];
  } catch { return STUN; }
}

const parse = (id: string, x: any): GCall => ({ id, gid: x.gid, type: x.type, host: x.host, members: x.members || [], active: x.active || [], status: x.status, startedAt: x.startedAt || 0 });

export async function createGroupCall(me: string, g: Group, type: CallType): Promise<string> {
  const ref = await addDoc(collection(db, "gcalls"), {
    gid: g.id, type, host: me, members: g.members, active: [], status: "live", startedAt: Date.now(), createdAt: serverTimestamp(),
  });
  g.members.filter((m) => m !== me && !g.muted[m]).forEach((m) =>
    notify(m, me, "message", { text: `${type === "video" ? "📹" : "📞"} Group ${type} call in ${g.name}`, key: `gcall_${ref.id}` }));
  return ref.id;
}

export function watchGroupCall(id: string, cb: (c: GCall | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "gcalls", id), (d) => cb(d.exists() ? parse(d.id, d.data()) : null), () => cb(null));
}

/** Live calls of groups I am in (for the "join" prompt). */
export function watchLiveCalls(me: string, cb: (c: GCall[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "gcalls"), where("members", "array-contains", me), where("status", "==", "live")),
    (snap) => cb(snap.docs.map((d) => parse(d.id, d.data()))),
    () => cb([]),
  );
}

export type GSession = { local: MediaStream; setMuted: (m: boolean) => void; setCamera: (on: boolean) => void; flip: () => Promise<void>; leave: () => Promise<void> };

/**
 * Mesh call: the person who joins sends an offer to everyone already in the room;
 * people already inside answer. Pair signalling lives in gcalls/{id}/signals.
 */
export async function joinGroupCall(
  callId: string, me: string, type: CallType,
  onStream: (uid: string, s: MediaStream) => void, onGone: (uid: string) => void,
): Promise<GSession> {
  const callRef = doc(db, "gcalls", callId);
  const call = parse(callId, (await getDoc(callRef)).data() || {});
  if (call.active.filter((u) => u !== me).length >= MAX_CALL - 1) throw new Error("This call is full.");
  let facing: "user" | "environment" = "user";
  const getMedia = (f: "user" | "environment") =>
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: type === "video" ? { facingMode: f } : false });
  const local = await getMedia(facing);
  const ice = await iceServers();
  const joinedAt = Date.now();
  const peers = new Map<string, RTCPeerConnection>();
  const unsubs: Unsubscribe[] = [];

  const makePeer = (other: string, pairRef: ReturnType<typeof doc>) => {
    const pc = new RTCPeerConnection({ iceServers: ice });
    const remote = new MediaStream();
    local.getTracks().forEach((t) => pc.addTrack(t, local));
    pc.ontrack = (e) => { e.streams[0]?.getTracks().forEach((t) => remote.addTrack(t)); onStream(other, remote); };
    pc.onicecandidate = (e) => { if (e.candidate) addDoc(collection(pairRef, "cands"), { from: me, ...e.candidate.toJSON() }).catch(() => {}); };
    unsubs.push(onSnapshot(collection(pairRef, "cands"), (snap) => snap.docChanges().forEach((c) => {
      const d: any = c.doc.data();
      if (c.type === "added" && d.from !== me) { const { from, ...cand } = d; pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {}); }
    })));
    peers.set(other, pc);
    return pc;
  };

  // 1) answer offers sent to me by people who join after me
  unsubs.push(onSnapshot(query(collection(callRef, "signals"), where("b", "==", me)), (snap) => snap.docChanges().forEach(async (c) => {
    const d: any = c.doc.data();
    if (c.type === "removed" || !d.offer || d.answer || d.at < joinedAt - 5000) return;
    const old = peers.get(d.a); if (old) { old.close(); peers.delete(d.a); }
    const pc = makePeer(d.a, c.doc.ref);
    await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);
    await updateDoc(c.doc.ref, { answer: { type: ans.type, sdp: ans.sdp } });
  })));

  // 2) offer to everyone who is already in the room
  for (const other of call.active.filter((u) => u !== me)) {
    const ref = doc(collection(callRef, "signals"));
    const pc = makePeer(other, ref);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await setDoc(ref, { a: me, b: other, at: Date.now(), offer: { type: offer.type, sdp: offer.sdp } });
    unsubs.push(onSnapshot(ref, (d) => {
      const a = (d.data() as any)?.answer;
      if (a && !pc.currentRemoteDescription) pc.setRemoteDescription(new RTCSessionDescription(a)).catch(() => {});
    }));
  }

  await updateDoc(callRef, { active: arrayUnion(me) });

  // people who left
  unsubs.push(onSnapshot(callRef, (d) => {
    const act: string[] = (d.data() as any)?.active || [];
    peers.forEach((pc, u) => { if (!act.includes(u)) { pc.close(); peers.delete(u); onGone(u); } });
  }));

  return {
    local,
    setMuted: (m) => local.getAudioTracks().forEach((t) => (t.enabled = !m)),
    setCamera: (on) => local.getVideoTracks().forEach((t) => (t.enabled = on)),
    flip: async () => {
      if (type !== "video") return;
      facing = facing === "user" ? "environment" : "user";
      const nt = (await getMedia(facing)).getVideoTracks()[0];
      peers.forEach((pc) => pc.getSenders().find((x) => x.track?.kind === "video")?.replaceTrack(nt));
      local.getVideoTracks().forEach((t) => { t.stop(); local.removeTrack(t); });
      local.addTrack(nt);
    },
    leave: async () => {
      unsubs.forEach((u) => u());
      local.getTracks().forEach((t) => t.stop());
      peers.forEach((pc) => pc.close());
      const snap = (await getDoc(callRef)).data() as any;
      const rest = (snap?.active || []).filter((u: string) => u !== me);
      await updateDoc(callRef, rest.length ? { active: arrayRemove(me) } : { active: [], status: "ended" }).catch(() => {});
    },
  };
}
