import { initializeApp } from "firebase/app";
import { Capacitor } from "@capacitor/core";
import {
  CustomProvider,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import {
  FirebaseAppCheck,
} from "@capacitor-firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBCnnHx7teFW1Jn5m2QDkvIKI5GdyVcHqY",
  authDomain: "learn-islam-891c3.firebaseapp.com",
  projectId: "learn-islam-891c3",
  storageBucket: "learn-islam-891c3.firebasestorage.app",
  messagingSenderId: "9616232938",
  appId:
    Capacitor.getPlatform() === "web"
      ? "1:9616232938:web:b168d52f83f8ffd910e293"
      : "1:9616232938:android:f553ff8de55893c310e293",
};

const app = initializeApp(firebaseConfig);

const RECAPTCHA_ENTERPRISE_SITE_KEY =
  "6LdV6_MtAAAAACItnRyQK-CQ5PIcDW-uj4ukTQ5f";

let appCheckInitialized = false;

export async function initializeFirebaseAppCheck(): Promise<void> {
  if (appCheckInitialized) return;

  if (Capacitor.getPlatform() === "web") {
    await initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(
        RECAPTCHA_ENTERPRISE_SITE_KEY,
      ),
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    await FirebaseAppCheck.initialize({
      isTokenAutoRefreshEnabled: true,
    });

    const nativeProvider = new CustomProvider({
      getToken: async () => {
        const result = await FirebaseAppCheck.getToken();
        let expireTimeMillis = result.expireTimeMillis;

        if (expireTimeMillis == null) {
          const payload = result.token.split(".")[1];
          if (!payload) {
            throw new Error("Native App Check token has no expiry information.");
          }

          const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
          const claims = JSON.parse(atob(normalized));
          if (typeof claims.exp !== "number") {
            throw new Error("Native App Check token has no expiry claim.");
            }

          expireTimeMillis = claims.exp * 1000;
        }

        return {
          token: result.token,
          expireTimeMillis,
        };
      },
    });

    await initializeAppCheck(app, {
      provider: nativeProvider,
      isTokenAutoRefreshEnabled: true,
    });
  }

  appCheckInitialized = true;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
