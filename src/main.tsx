import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initBackButton } from "./lib/backButton";

initBackButton();

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(e: unknown) {
    return { error: String((e as Error)?.message || e).slice(0, 300) };
  }

  reset = async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) || [];
      await Promise.all(regs.map((r) => r.unregister()));
      const keys = (await window.caches?.keys?.()) || [];
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 24, fontFamily: "sans-serif", color: "#064e3b" }}>
        <h3>Something went wrong</h3>
        <p style={{ fontSize: 13, wordBreak: "break-all" }}>{this.state.error}</p>
        <button
          onClick={this.reset}
          style={{ marginTop: 12, padding: "10px 18px", borderRadius: 8, background: "#065f46", color: "#fff", border: 0 }}
        >
          Reload
        </button>
      </div>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

// Add AdSense
const adsScript=document.createElement('script');
adsScript.async=true;
adsScript.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2017693738727848';
adsScript.crossOrigin='anonymous';
document.head.appendChild(adsScript);
