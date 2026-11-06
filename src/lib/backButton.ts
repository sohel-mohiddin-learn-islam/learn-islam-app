import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Overlays (story viewer, share sheet, comments) register here so Android's back button closes them first.
const stack: (() => void)[] = [];

export function useBackClose(onClose: () => void) {
  useEffect(() => {
    const fn = () => onClose();
    stack.push(fn);
    return () => {
      const i = stack.lastIndexOf(fn);
      if (i >= 0) stack.splice(i, 1);
    };
  }, []);
}

function toast(msg: string) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText =
    "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:10px 18px;border-radius:20px;z-index:2147483647;font:14px sans-serif";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

export function initBackButton() {
  if (!Capacitor.isNativePlatform()) return;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let lastBack = 0;

  CapApp.addListener("backButton", () => {
    const top = stack[stack.length - 1];
    if (top) return top();

    const path = window.location.pathname.replace(base, "") || "/";
    if (path === "/" || path === "") {
      if (Date.now() - lastBack < 2000) return void CapApp.exitApp();
      lastBack = Date.now();
      return toast("Press back again to exit");
    }
    if (window.history.length > 1) window.history.back();
    else {
      // nothing earlier in history: go to the home screen instead of closing the app
      window.history.pushState({}, "", base + "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  });
}
