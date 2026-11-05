import {
  collection,
  doc,
  getCountFromServer,
  increment,
  setDoc,
  where,
  query,
} from "firebase/firestore";

import { db } from "./firebase";
import { getFollowingIds } from "./social";

const dayStamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, "");

// ---------- what we know about the device (no tracking services, just the phone's own settings) ----------
const TZ_COUNTRY: Record<string, string> = {
  "Asia/Calcutta": "India", "Asia/Kolkata": "India", "Asia/Karachi": "Pakistan", "Asia/Dhaka": "Bangladesh",
  "Africa/Lagos": "Nigeria", "Europe/Istanbul": "Turkey", "America/New_York": "United States",
  "America/Chicago": "United States", "America/Los_Angeles": "United States", "Asia/Dubai": "United Arab Emirates",
  "Asia/Riyadh": "Saudi Arabia", "Europe/London": "United Kingdom", "Asia/Jakarta": "Indonesia",
  "Asia/Kuala_Lumpur": "Malaysia", "Africa/Cairo": "Egypt", "Asia/Colombo": "Sri Lanka", "Asia/Kathmandu": "Nepal",
};
const TZ_CITY: Record<string, string> = { Calcutta: "Kolkata" };

export function deviceInfo() {
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    /* ignore */
  }
  const lang = (navigator.language || "en").split("-");
  let country = TZ_COUNTRY[tz] || "";
  try {
    if (!country && lang[1]) country = new Intl.DisplayNames(["en"], { type: "region" }).of(lang[1].toUpperCase()) || "";
  } catch {
    /* ignore */
  }
  let language = lang[0];
  try {
    language = new Intl.DisplayNames(["en"], { type: "language" }).of(lang[0]) || lang[0];
  } catch {
    /* ignore */
  }
  const rawCity = tz.split("/")[1]?.replace(/_/g, " ") || "";
  return { country: country || "Unknown", city: TZ_CITY[rawCity] || rawCity || "Unknown", language };
}

// ---------- recording ----------
const done = new Set<string>();
const once = (key: string) => (done.has(key) ? false : (done.add(key), true));

let followingCache: { uid: string; ids: Set<string> } | null = null;
async function followsOwner(me: string, owner: string) {
  if (!followingCache || followingCache.uid !== me) {
    followingCache = { uid: me, ids: new Set(await getFollowingIds(me).catch(() => [])) };
  }
  return followingCache.ids.has(owner);
}
export const forgetFollowingCache = () => (followingCache = null);

export async function recordReelView(postId: string, ownerId: string, me: string) {
  if (me === ownerId || !once(`view-${postId}`)) return;
  const d = deviceInfo();
  await setDoc(
    doc(db, "posts", postId, "views", me),
    {
      userId: ownerId,
      isFollower: await followsOwner(me, ownerId),
      country: d.country,
      city: d.city,
      language: d.language,
      lastAt: Date.now(),
      count: increment(1),
    },
    { merge: true }
  ).catch(() => {});
}

export async function recordStoryView(ownerId: string, storyId: string, me: string) {
  if (me === ownerId || !once(`sview-${storyId}`)) return;
  await setDoc(
    doc(db, "users", ownerId, "stories", storyId, "views", me),
    { isFollower: await followsOwner(me, ownerId), lastAt: Date.now() },
    { merge: true }
  ).catch(() => {});
}

export async function recordProfileVisit(ownerId: string, me: string) {
  if (me === ownerId || !once(`visit-${ownerId}-${dayStamp()}`)) return;
  await setDoc(doc(db, "users", ownerId, "visits", `${me}_${dayStamp()}`), { visitorId: me, at: Date.now() }).catch(() => {});
}

export async function recordFollowEvent(ownerId: string, me: string, type: "follow" | "unfollow") {
  await setDoc(doc(db, "users", ownerId, "followEvents", `${type}_${me}_${Date.now()}`), { by: me, type, at: Date.now() }).catch(() => {});
}

export async function recordShare(postId: string, me: string) {
  await setDoc(doc(db, "posts", postId, "shares", me), { at: Date.now() }, { merge: true }).catch(() => {});
}

export async function setSaveMarker(postId: string, me: string, on: boolean) {
  const ref = doc(db, "posts", postId, "saves", me);
  if (on) await setDoc(ref, { at: Date.now() }).catch(() => {});
  else {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(ref).catch(() => {});
  }
}

/** Remember when (day + 3-hour slot) this person uses the app, and where from: used for "follower active times" and audience. */
export async function recordActivityAndDevice(me: string) {
  const now = new Date();
  const slot = `d${now.getDay()}h${Math.floor(now.getHours() / 3) * 3}`;
  if (!once(`act-${me}-${slot}`)) return;
  const d = deviceInfo();
  await setDoc(
    doc(db, "users", me),
    { activity: { [slot]: increment(1) }, country: d.country, city: d.city, language: d.language },
    { merge: true }
  ).catch(() => {});
}

// ---------- counts ----------
export async function countOf(path: [string, ...string[]], ...filters: ReturnType<typeof where>[]): Promise<number> {
  try {
    const col = collection(db, ...(path as [string, ...string[]]));
    const snap = await getCountFromServer(filters.length ? query(col, ...filters) : col);
    return snap.data().count;
  } catch {
    return 0;
  }
}

export type ReelCounts = { likes: number; comments: number; shares: number; saves: number };

export async function getReelCounts(postId: string): Promise<ReelCounts> {
  const [likes, comments, shares, saves] = await Promise.all([
    countOf(["posts", postId, "likes"]),
    countOf(["posts", postId, "comments"]),
    countOf(["posts", postId, "shares"]),
    countOf(["posts", postId, "saves"]),
  ]);
  return { likes, comments, shares, saves };
}

export const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));
