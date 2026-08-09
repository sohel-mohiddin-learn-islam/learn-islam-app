import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These values come from your Firebase project settings.
// They are safe to expose in client code — Firebase security
// is enforced through Firestore/Storage rules, not by hiding this config.
const firebaseConfig = {
  apiKey: "AIzaSyBCnnHx7teFW1Jn5m2QDkvIKI5GdyVcHqY",
  authDomain: "learn-islam-891c3.firebaseapp.com",
  projectId: "learn-islam-891c3",
  storageBucket: "learn-islam-891c3.firebasestorage.app",
  messagingSenderId: "9616232938",
  appId: "1:9616232938:android:f553ff8de55893c310e293",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
