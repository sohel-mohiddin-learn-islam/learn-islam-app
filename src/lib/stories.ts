import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type Story = {
  id: string;
  ownerId: string;
  mediaUrl: string;
  type: "image" | "video";
  createdAt: number;
  expiresAt: number;
  closeOnly: boolean;
  caption?: string;
  reelId?: string;
  overlays?: any[];
  audioUrl?: string;
  audioTitle?: string;
};

const DAY = 24 * 60 * 60 * 1000;

export async function addStory(owner: string, mediaUrl: string, type: "image" | "video", closeOnly: boolean, extra?: { caption?: string; reelId?: string; overlays?: any[]; audioUrl?: string; audioTitle?: string }) {
  const col = closeOnly ? "closeStories" : "stories";
  await addDoc(collection(db, "users", owner, col), {
    mediaUrl,
    type,
    closeOnly,
    caption: extra?.caption || "",
    reelId: extra?.reelId || "",
    overlays: extra?.overlays || [],
    audioUrl: extra?.audioUrl || "",
    audioTitle: extra?.audioTitle || "",
    createdAt: Date.now(),
    expiresAt: Date.now() + DAY,
    serverAt: serverTimestamp(),
  });
}

export async function deleteStory(owner: string, story: Story) {
  await deleteDoc(doc(db, "users", owner, story.closeOnly ? "closeStories" : "stories", story.id));
}

async function readCollection(owner: string, col: "stories" | "closeStories"): Promise<Story[]> {
  try {
    const snap = await getDocs(collection(db, "users", owner, col));
    const now = Date.now();
    return snap.docs
      .map((d) => ({ id: d.id, ownerId: owner, closeOnly: col === "closeStories", ...(d.data() as any) }) as Story)
      .filter((s) => s.expiresAt > now);
  } catch {
    return []; // not allowed to see these (not a follower / not a close friend)
  }
}

/** Active stories of one person that the signed-in viewer is allowed to see. */
export async function getStories(owner: string): Promise<Story[]> {
  const [a, b] = await Promise.all([readCollection(owner, "stories"), readCollection(owner, "closeStories")]);
  return [...a, ...b].sort((x, y) => x.createdAt - y.createdAt);
}

// ---- close friends ----
export async function getCloseFriendIds(owner: string): Promise<string[]> {
  const snap = await getDocs(collection(db, "users", owner, "closeFriends"));
  return snap.docs.map((d) => d.id);
}

export async function setCloseFriend(owner: string, friend: string, on: boolean) {
  const ref = doc(db, "users", owner, "closeFriends", friend);
  if (on) await setDoc(ref, { createdAt: serverTimestamp() });
  else await deleteDoc(ref);
}

// ---- seen markers (this device) ----
const seenKey = (owner: string) => `story-seen-${owner}`;
export const markSeen = (owner: string, latest: number) => {
  try {
    localStorage.setItem(seenKey(owner), String(latest));
  } catch {
    /* ignore */
  }
};
export const hasUnseen = (owner: string, latest: number) => {
  try {
    return Number(localStorage.getItem(seenKey(owner)) || 0) < latest;
  } catch {
    return true;
  }
};

/** Every story the owner ever posted (including expired ones), newest first. Used for highlights. */
export async function getStoryArchive(owner: string): Promise<Story[]> {
  const out: Story[] = [];
  for (const col of ["stories", "closeStories"] as const) {
    const snap = await getDocs(collection(db, "users", owner, col)).catch(() => null);
    snap?.docs.forEach((d) => out.push({ id: d.id, ownerId: owner, closeOnly: col === "closeStories", ...(d.data() as any) } as Story));
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}
