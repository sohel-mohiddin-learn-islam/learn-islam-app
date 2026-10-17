import { createRoot } from "react-dom/client";
import { initializeFirebaseAppCheck } from "./lib/firebase";
import "./index.css";

async function startApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Application root element was not found.");
  }

  try {
    await initializeFirebaseAppCheck();
    const { default: App } = await import("./App");
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error("Firebase App Check initialization failed:", error);
    rootElement.textContent =
      "Security verification could not start. Please check your internet connection and reopen Learn Islam.";
  }
}

void startApp();

// Add AdSense
const adsScript = document.createElement("script");
adsScript.async = true;
adsScript.src =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2017693738727848";
adsScript.crossOrigin = "anonymous";
document.head.appendChild(adsScript);
