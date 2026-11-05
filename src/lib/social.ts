import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";
import { uploadImage } from "./posts";

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
    createdAt: serverTimestamp(),
  });
}

export async function unfollow(me: string, other: string) {
  await deleteDoc(doc(db, "follows", followId(me, other)));
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
