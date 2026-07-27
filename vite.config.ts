import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

if (port && Number.isNaN(port)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

export default defineConfig({

  plugins: [
    {
      name: 'serve-sitemap',
      configureServer(server) {
        
        server.middlewares.use('/ads.txt', (req, res) => {
          res.setHeader('Content-Type', 'text/plain');
          res.end('google.com, pub-2017693738727848, DIRECT, f08c47fec0942fa0');
        });
        server.middlewares.use('/sitemap.xml', (req, res) => {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://nabi-stories--sadf38038.replit.app/</loc><priority>1.0</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/prophets</loc><priority>0.9</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/karbala</loc><priority>0.9</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/asmaul-husna</loc><priority>0.8</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/quran-values</loc><priority>0.8</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/surahs</loc><priority>0.8</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/hadiths</loc><priority>0.8</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/duas</loc><priority>0.8</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/sahabah</loc><priority>0.7</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/prayer-guide</loc><priority>0.7</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/calendar</loc><priority>0.7</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/kids</loc><priority>0.7</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/about</loc><priority>0.6</priority></url><url><loc>https://nabi-stories--sadf38038.replit.app/privacy.html</loc><priority>0.5</priority></url></urlset>');
        });
      }
    },
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    middlewareMode: false,
    middlewareMode: false,
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
