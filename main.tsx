import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Add AdSense
const adsScript=document.createElement('script');
adsScript.async=true;
adsScript.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2017693738727848';
adsScript.crossOrigin='anonymous';
document.head.appendChild(adsScript);
