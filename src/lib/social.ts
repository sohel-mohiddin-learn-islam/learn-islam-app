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
  avatarArt?: any;
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
    avatarArt: d.avatarArt || undefined,
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

/** Follows a public account straight away; for a private account it sends a request ("requested"). */
export async function follow(me: string, other: string): Promise<"following" | "requested"> {
  const priv = await getDoc(doc(db, "users", other)).then((s) => !!(s.data() as any)?.isPrivate).catch(() => false);
  if (priv) {
    await setDoc(doc(db, "followRequests", followId(me, other)), { from: me, to: other, createdAt: Date.now() });
    return "requested";
  }
  await setDoc(doc(db, "follows", followId(me, other)), {
    followerId: me,
    followingId: other,
    createdAt: Date.now(),
  });
  forgetFollowingCache();
  recordFollowEvent(other, me, "follow");
  return "following";
}

export async function hasRequested(me: string, other: string): Promise<boolean> {
  return (await getDoc(doc(db, "followRequests", followId(me, other)))).exists();
}

export const cancelRequest = (me: string, other: string) => deleteDoc(doc(db, "followRequests", followId(me, other)));

/** People waiting for `me` to accept their follow request. */
export async function getFollowRequests(me: string): Promise<string[]> {
  const snap = await getDocs(query(collection(db, "followRequests"), where("to", "==", me)));
  return snap.docs.map((d) => (d.data() as any).from as string);
}

export async function acceptRequest(me: string, from: string) {
  await setDoc(doc(db, "follows", followId(from, me)), { followerId: from, followingId: me, createdAt: Date.now() });
  await deleteDoc(doc(db, "followRequests", followId(from, me)));
  forgetFollowingCache();
  recordFollowEvent(me, me, "follow");
}

export const declineRequest = (me: string, from: string) => deleteDoc(doc(db, "followRequests", followId(from, me)));

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
