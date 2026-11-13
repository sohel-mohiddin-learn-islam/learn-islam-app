import { useState } from "react";

/** Shown only to iPhone/iPad visitors in Safari: iOS has no APK, so the website is installed from the Share menu. */
export default function InstallHint() {
  const [hide, setHide] = useState(() => { try { return localStorage.getItem("ios-hint") === "1"; } catch { return false; } });
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = (navigator as any).standalone === true || window.matchMedia?.("(display-mode: standalone)").matches;
  const native = !!(window as any).Capacitor?.isNativePlatform?.();
  if (!ios || standalone || native || hide) return null;
  return (
    <div className="fixed bottom-3 left-3 right-3 z-[200] rounded-2xl bg-card border border-border shadow-xl p-4 text-sm font-sans">
      <button onClick={() => { try { localStorage.setItem("ios-hint", "1"); } catch { /* ignore */ } setHide(true); }} className="absolute top-2 right-3 text-lg" aria-label="Close">✕</button>
      <p className="font-semibold mb-1">Install Learn Islam on your iPhone</p>
      <p className="text-foreground/70">Open this page in Safari, tap the Share button <span className="font-bold">⬆️</span>, then choose <b>Add to Home Screen</b>. It opens like a normal app.</p>
    </div>
  );
}
