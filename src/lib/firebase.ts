import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCnnHx7teFW1Jn5m2QDkvIKI5GdyVcHqY",
  authDomain: "learn-islam-891c3.firebaseapp.com",
  projectId: "learn-islam-891c3",
  storageBucket: "learn-islam-891c3.firebasestorage.app",
  messagingSenderId: "9616232938",
  appId: "1:9616232938:android:f553ff8de55893c310e293",
};

// This project's Firestore database is named "default" (not the usual "(default)")
export const FIRESTORE_DATABASE_ID = "default";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Long-polling auto-detect: WebChannel streams can hang inside Android WebViews, which made saves stall
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, FIRESTORE_DATABASE_ID);
export const storage = getStorage(app);

export default app;
