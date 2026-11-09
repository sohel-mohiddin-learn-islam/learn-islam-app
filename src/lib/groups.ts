import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { notify } from "./notifications";
import type { Message } from "./chat";

export type Group = {
  id: string;
  name: string;
  photo: string | null;
  members: string[];
  admins: string[];
  createdBy: string;
  lastMessage: string;
  lastAt: number;
  lastSender: string;
  lastRead: Record<string, number>;
  theme: string;
  font: string;
  disappear: number;
  muted: Record<string, boolean>;
  clearedAt: Record<string, number>;
};

export const MAX_GROUP = 50;
export const MAX_CALL = 6; // mesh calls: every phone connects to every other phone

const millis = (t: any) => (t?.toMillis ? t.toMillis() : typeof t === "number" ? t : Date.now());

const parse = (id: string, x: any): Group => ({
  id,
  name: x.name || "Group",
  photo: x.photo || null,
  members: x.members || [],
  admins: x.admins || [],
  createdBy: x.createdBy || "",
  lastMessage: x.lastMessage || "",
  lastAt: millis(x.lastAt),
  lastSender: x.lastSender || "",
  lastRead: x.lastRead || {},
  theme: x.theme || "default",
  font: x.font || "default",
  disappear: x.disappear || 0,
  muted: x.muted || {},
  clearedAt: x.clearedAt || {},
});

export async function createGroup(me: string, name: string, memberIds: string[], photo: string | null): Promise<string> {
  const members = Array.from(new Set([me, ...memberIds])).slice(0, MAX_GROUP);
  const ref = doc(collection(db, "groups"));
  await setDoc(ref, {
    name: name.trim().slice(0, 40) || "New group",
    photo,
    members,
    admins: [me],
    createdBy: me,
    lastMessage: "Group created",
    lastSender: me,
    lastAt: serverTimestamp(),
    lastRead: { [me]: Date.now() },
    theme: "default",
    font: "default",
    disappear: 0,
    muted: {},
    clearedAt: {},
  });
  members.filter((m) => m !== me).forEach((m) => notify(m, me, "message", { text: `added you to the group "${name.trim().slice(0, 30)}"`, key: `group_${ref.id}` }));
  return ref.id;
}

export function watchGroups(me: string, cb: (g: Group[]) => void, onError?: (e: any) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "groups"), where("members", "array-contains", me)),
    (snap) => cb(snap.docs.map((d) => parse(d.id, d.data())).sort((a, b) => b.lastAt - a.lastAt)),
    onError,
  );
}

export function watchGroup(gid: string, cb: (g: Group | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "groups", gid), (d) => cb(d.exists() ? parse(d.id, d.data()) : null), () => cb(null));
}

export function watchGroupMessages(gid: string, cb: (m: Message[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "groups", gid, "messages"), orderBy("createdAt", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any), createdAt: millis((d.data() as any).createdAt) }))),
    () => cb([]),
  );
}

export async function sendGroupMessage(me: string, g: Group, text: string) {
  const clean = text.trim();
  if (!clean) return;
  await addDoc(collection(db, "groups", g.id, "messages"), {
    from: me,
    text: clean.slice(0, 2000),
    createdAt: serverTimestamp(),
    ...(g.disappear ? { expiresAt: Date.now() + g.disappear * 1000 } : {}),
  });
  await updateDoc(doc(db, "groups", g.id), {
    lastMessage: clean.slice(0, 200),
    lastSender: me,
    lastAt: serverTimestamp(),
    [`lastRead.${me}`]: Date.now(),
  });
  g.members.filter((m) => m !== me && !g.muted[m]).forEach((m) => notify(m, me, "message", { text: `${g.name}: ${clean.slice(0, 60)}`, key: `group_${g.id}` }));
}

export const markGroupRead = (me: string, gid: string) => updateDoc(doc(db, "groups", gid), { [`lastRead.${me}`]: Date.now() }).catch(() => {});

export const updateGroup = (gid: string, patch: Record<string, any>) => updateDoc(doc(db, "groups", gid), patch);

export const addMembers = (gid: string, ids: string[]) => updateDoc(doc(db, "groups", gid), { members: arrayUnion(...ids) });
export const removeMember = (gid: string, uid: string) => updateDoc(doc(db, "groups", gid), { members: arrayRemove(uid), admins: arrayRemove(uid) });
export const makeAdmin = (gid: string, uid: string) => updateDoc(doc(db, "groups", gid), { admins: arrayUnion(uid) });

/** Leave a group; if you were the last admin the oldest remaining member becomes admin. */
export async function leaveGroup(me: string, gid: string) {
  const g = (await getDoc(doc(db, "groups", gid))).data() as any;
  const rest: string[] = (g?.members || []).filter((m: string) => m !== me);
  const admins: string[] = (g?.admins || []).filter((m: string) => m !== me);
  if (rest.length && !admins.length) admins.push(rest[0]);
  await updateDoc(doc(db, "groups", gid), { members: rest, admins });
}

export const visibleGroupMessages = (list: Message[], me: string, g: Group): Message[] => {
  const now = Date.now();
  const cleared = g.clearedAt[me] || 0;
  return list.filter((m) => (!m.expiresAt || m.expiresAt > now) && m.createdAt > cleared);
};

export const deleteGroupMessage = (gid: string, id: string) => deleteDoc(doc(db, "groups", gid, "messages", id)).catch(() => {});
