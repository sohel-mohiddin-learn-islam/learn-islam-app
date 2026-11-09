import { Capacitor } from "@capacitor/core";

export type ShareResult = "shared" | "copied" | "failed";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Opens the phone's share sheet. Android's WebView has no navigator.share, so inside the app we use the
 * native Capacitor Share plugin; in a browser we use navigator.share; if neither works the text is copied.
 */
export async function shareContent(opts: { title?: string; text?: string; url?: string }): Promise<ShareResult> {
  const { title = "Learn Islam", text = "", url } = opts;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, url, dialogTitle: "Share" });
      return "shared";
    } catch (e: any) {
      if (/cancel/i.test(String(e?.message || e))) return "failed";
    }
  } else if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "failed";
    }
  }
  return (await copyText([text, url].filter(Boolean).join("\n"))) ? "copied" : "failed";
}
