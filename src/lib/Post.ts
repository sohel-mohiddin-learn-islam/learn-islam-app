import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "./firebase";

export async function uploadVideo(
  file: File,
  userId: string
): Promise<string> {
  const extension = file.name.split(".").pop() || "mp4";

  const storageRef = ref(
    storage,
    `posts/${userId}/${Date.now()}.${extension}`
  );

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

export async function createPost(params: {
  userId: string;
  userName: string;
  userPhoto: string | null;
  caption: string;
  videoUrl: string;
}) {
  const docRef = await addDoc(collection(db, "posts"), {
    userId: params.userId,
    userName: params.userName,
    userPhoto: params.userPhoto,
    caption: params.caption,
    videoUrl: params.videoUrl,
    thumbnailUrl: null,
    createdAt: serverTimestamp(),
    likesCount: 0,
    commentsCount: 0,
  });

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

export async function deletePost(
  postId: string,
  userId: string,
  videoUrl?: string
) {
  const postRef = doc(db, "posts", postId);

  const postQuery = query(
    collection(db, "posts"),
    where("__name__", "==", postId)
  );

  const snapshot = await getDocs(postQuery);

  if (snapshot.empty) {
    throw new Error("Post not found.");
  }

  const postData = snapshot.docs[0].data();

  if (postData.userId !== userId) {
    throw new Error("You can only delete your own posts.");
  }

  await deleteDoc(postRef);

  if (videoUrl) {
    try {
      const videoRef = ref(storage, videoUrl);
      await deleteObject(videoRef);
    } catch {
      // Firestore deletion has already succeeded.
      // Storage cleanup can be handled separately.
    }
  }
}
