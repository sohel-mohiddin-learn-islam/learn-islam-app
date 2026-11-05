import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  where,
} from "firebase/firestore";

import { db } from "./firebase";
import { uploadImage } from "./posts";
import { recordFollowEvent, forgetFollowingCache } from "./analytics";

export type UserProfile = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  link: string;
};

export async function getProfile(uid: string): Promise<UserProfile> {
  const snap = await getDoc(doc(db, "users", uid));
  const d: any = snap.exists() ? snap.data() : {};
  return {
    uid,
    displayName: d.displayName || "Learn Islam User",
    photoURL: d.photoURL || null,
    bio: d.bio || "",
    link: d.link || "",
  };
}

export async function saveProfile(
  uid: string,
  data: { displayName: string; bio: string; link: string; photoURL?: string | null }
) {
  await setDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export { uploadImage };

const followId = (follower: string, following: string) => `${follower}_${following}`;

export async function isFollowing(me: string, other: string) {
  const snap = await getDoc(doc(db, "follows", followId(me, other)));
  return snap.exists();
}

export async function follow(me: string, other: string) {
  await setDoc(doc(db, "follows", followId(me, other)), {
    followerId: me,
    followingId: other,
    createdAt: Date.now(),
  });
  forgetFollowingCache();
  recordFollowEvent(other, me, "follow");
}

export async function unfollow(me: string, other: string) {
  await deleteDoc(doc(db, "follows", followId(me, other)));
  forgetFollowingCache();
  recordFollowEvent(other, me, "unfollow");
}

/** User ids that follow `uid`. */
export async function getFollowerIds(uid: string): Promise<string[]> {
  const snap = await getDocs(query(collection(db, "follows"), where("followingId", "==", uid)));
  return snap.docs.map((d) => (d.data() as any).followerId as string);
}

/** User ids that `uid` follows. */
export async function getFollowingIds(uid: string): Promise<string[]> {
  const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", uid)));
  return snap.docs.map((d) => (d.data() as any).followingId as string);
}

/** Removes someone from your followers. */
export async function removeFollower(me: string, follower: string) {
  await deleteDoc(doc(db, "follows", followId(follower, me)));
  recordFollowEvent(me, me, "unfollow");
}

export type Relations = { blocked: string[]; muted: string[]; isPrivate: boolean };

export async function getRelations(uid: string): Promise<Relations> {
  const snap = await getDoc(doc(db, "users", uid));
  const d: any = snap.exists() ? snap.data() : {};
  return { blocked: d.blocked || [], muted: d.muted || [], isPrivate: !!d.isPrivate };
}

export async function setPrivate(uid: string, isPrivate: boolean) {
  await setDoc(doc(db, "users", uid), { isPrivate }, { merge: true });
}

async function listOp(uid: string, field: "blocked" | "muted", other: string, add: boolean) {
  await setDoc(doc(db, "users", uid), { [field]: add ? arrayUnion(other) : arrayRemove(other) }, { merge: true });
}

export const blockUser = (me: string, other: string) => listOp(me, "blocked", other, true);
export const unblockUser = (me: string, other: string) => listOp(me, "blocked", other, false);
export const muteUser = (me: string, other: string) => listOp(me, "muted", other, true);
export const unmuteUser = (me: string, other: string) => listOp(me, "muted", other, false);

export async function getIsPrivate(uid: string): Promise<boolean> {
  return (await getRelations(uid)).isPrivate;
}

export { updateDoc };
