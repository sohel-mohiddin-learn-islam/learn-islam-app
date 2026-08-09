import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5-jzkWZVp24W49aWrhuEYPkorl6tqvhI",
  authDomain: "learn-islam-891c3.firebaseapp.com",
  projectId: "learn-islam-891c3",
  storageBucket: "learn-islam-891c3.firebasestorage.app",
  messagingSenderId: "9616232938",
  appId: "1:9616232938:web:b168d52f83f8ffd910e293",
  measurementId: "G-YZ4CPDR2BG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
