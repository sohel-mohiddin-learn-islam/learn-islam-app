import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { Capacitor, CapacitorHttp } from "@capacitor/core";

import { auth, db } from "./firebase";

const CLOUDINARY_CLOUD_NAME = "mpyzgv8c";
const CLOUDINARY_UPLOAD_PRESET = "learn_islam_reels";

const CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB pieces: keeps memory low on phones

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

type ProgressFn = (percent: number) => void;

function sendChunk(
  url: string,
  blob: Blob,
  fileName: string,
  uploadId: string,
  start: number,
  end: number,
  total: number,
  onBytes: (loaded: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", blob, fileName);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("X-Unique-Upload-Id", uploadId);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${total}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onBytes(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({});
        }
      } else {
        console.error("Cloudinary chunk failed:", xhr.status, xhr.responseText);
        reject(new Error(`Cloudinary upload failed (${xhr.status}).`));
      }
    };
    xhr.timeout = 5 * 60 * 1000;
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.ontimeout = () => reject(new Error("Upload timed out."));
    xhr.send(form);
  });
}

async function chunkedUpload(
  file: File | Blob,
  fileName: string,
  resource: "video" | "image",
  onProgress?: ProgressFn
): Promise<any> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resource}/upload`;
  const total = file.size;
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let last: any = {};

  for (let start = 0; start < total; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, total);
    const piece = file.slice(start, end);

    let attempt = 0;
    for (;;) {
      try {
        last = await sendChunk(url, piece, fileName, uploadId, start, end, total, (loaded) => {
          onProgress?.(Math.min(99, Math.round(((start + loaded) / total) * 100)));
        });
        break;
      } catch (err) {
        attempt += 1;
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }
  }

  onProgress?.(100);
  return last;
}

export async function uploadVideo(
  file: File,
  userId: string,
  onProgress?: ProgressFn
): Promise<string> {
  void userId;
  const data = await chunkedUpload(file, file.name || "reel.mp4", "video", onProgress);

  if (!data.secure_url) {
    console.error("Cloudinary response:", data);
    throw new Error("Cloudinary did not return a video URL.");
  }

  return data.secure_url;
}

/** Uploads a picture to use as the reel thumbnail. Returns null if it fails (a frame of the video is used instead). */
export async function uploadThumbnail(blob: Blob): Promise<string | null> {
  try {
    const data = await chunkedUpload(blob, "thumbnail.jpg", "image");
    return data.secure_url || null;
  } catch (err) {
    console.error("Thumbnail upload failed:", err);
    return null;
  }
}

/** Picture of the first second of a Cloudinary video (works for every post, old and new). */
export function autoThumbnailUrl(videoUrl: string): string | undefined {
  if (!videoUrl.includes("/video/upload/")) return undefined;
  return videoUrl
    .replace("/video/upload/", "/video/upload/so_1,w_480,h_720,c_fill,f_jpg/")
    .replace(/\.[a-zA-Z0-9]+(\?.*)?$/, ".jpg");
}

export function postThumbnail(post: { thumbnailUrl?: string | null; videoUrl?: string }): string | undefined {
  return post.thumbnailUrl || (post.videoUrl ? autoThumbnailUrl(post.videoUrl) : undefined);
}

/** Phone-friendly copy of a Cloudinary video (H.264, max 720p) so long/4K reels play smoothly. */
export function optimizedVideoUrl(videoUrl: string): string {
  if (!videoUrl.includes("/video/upload/")) return videoUrl;
  return videoUrl.replace("/video/upload/", "/video/upload/f_mp4,vc_h264,q_auto,w_720,c_limit/");
}

const FIRESTORE_DATABASES = ["(default)", "default"];
const firestoreRest = (database: string) =>
  `https://firestore.googleapis.com/v1/projects/learn-islam-891c3/databases/${encodeURIComponent(database)}/documents`;

const str = (v: string | null | undefined) => (v ? { stringValue: v } : { nullValue: null });

/**
 * Inside the Android app the web view's own Firestore connection can hang on some networks,
 * so the post is saved over the phone's native HTTP stack instead (same idea as the old native plugin).
 */
async function createPostNative(params: {
  userId: string;
  userName: string;
  userPhoto: string | null;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string | null;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  const token = await user.getIdToken();

  const body = {
    fields: {
      userId: str(params.userId),
      userName: str(params.userName),
      userPhoto: str(params.userPhoto),
      caption: { stringValue: params.caption || "" },
      videoUrl: str(params.videoUrl),
      thumbnailUrl: str(params.thumbnailUrl),
      createdAt: { timestampValue: new Date().toISOString() },
      likesCount: { integerValue: "0" },
      commentsCount: { integerValue: "0" },
    },
  };

  let res: any = null;
  const tried: string[] = [];
  for (const database of FIRESTORE_DATABASES) {
    res = await CapacitorHttp.post({
      url: `${firestoreRest(database)}/posts`,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: body,
      connectTimeout: 30000,
      readTimeout: 30000,
    });
    if (res.status >= 200 && res.status < 300) break;
    tried.push(`${database}: ${res.status}`);
    if (res.status !== 404) break; // only a missing database name is worth retrying
  }

  if (res.status < 200 || res.status >= 300) {
    const detail = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    throw new Error(`Could not save the post [${tried.join(", ")}] ${detail.slice(0, 180)}`);
  }
  const name: string = res.data?.name || "";
  return name.split("/").pop() || "";
}

export async function createPost(params: {
  userId: string;
  userName: string;
  userPhoto: string | null;
  caption: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
}) {
  const thumbnailUrl = params.thumbnailUrl || autoThumbnailUrl(params.videoUrl) || null;

  if (Capacitor.isNativePlatform()) {
    return createPostNative({ ...params, thumbnailUrl });
  }

  const docRef = await withTimeout(
    addDoc(collection(db, "posts"), {
      userId: params.userId,
      userName: params.userName,
      userPhoto: params.userPhoto,
      caption: params.caption,
      videoUrl: params.videoUrl,
      thumbnailUrl,
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    }),
    60000,
    "Could not save the post (the database did not answer in 60 seconds)."
  );

  return docRef.id;
}

export async function getPosts() {
  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(postsQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getUserPosts(userId: string) {
  const all = await getPosts();
  return all.filter((p: any) => p.userId === userId);
}

export async function deletePost(
  postId: string,
  userId: string,
  videoUrl?: string
) {
  void videoUrl;
  const postRef = doc(db, "posts", postId);
  const snapshot = await getDoc(postRef);

  if (!snapshot.exists()) {
    throw new Error("Post not found.");
  }

  const post = snapshot.data();

  if (post.userId !== userId) {
    throw new Error("You can only delete your own posts.");
  }

  await deleteDoc(postRef);
}
