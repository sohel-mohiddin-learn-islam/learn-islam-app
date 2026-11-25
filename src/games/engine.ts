// Shared 3D engine for the games: stage (renderer + lights), touch / keyboard input and the Game base class.
import * as THREE from "three";
import type { Gender, Kit } from "./characters";

export interface Hud {
  set(slot: string, value: string | number): void;
  toast(msg: string, ms?: number): void;
  end(title: string, detail: string, score?: number): void;
}

export interface Controls {
  mode: "move" | "aim" | "tap";
  buttons: { id: string; label: string }[];
  hint: string;
}

export interface GameCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  hud: Hud;
  input: Input;
  base: string;
  gender: Gender;
  kit: Kit;
}

export abstract class Game {
  ctx: GameCtx;
  constructor(ctx: GameCtx) { this.ctx = ctx; }
  crosshair = false;
  abstract init(): Promise<void>;
  abstract update(dt: number): void;
  dispose(): void {}
}

export function createStage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  const resize = () => {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 450;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  return { renderer, scene, camera, resize };
}

/** Sunny outdoor lighting with a shadow that follows `target`. */
export function addSun(scene: THREE.Scene, target?: THREE.Object3D, size = 30) {
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a6b3a, 1.0));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
  sun.position.set(18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const c = sun.shadow.camera;
  c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 1; c.far = 90;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  if (target) { sun.target = target; scene.add(target); }
  return sun;
}

export class Input {
  x = 0; // stick left/right  (-1..1)
  y = 0; // stick forward/back (-1..1, forward = +1)
  held: Record<string, boolean> = {};
  drag = { active: false, x0: 0, y0: 0, x: 0, y: 0, t0: 0 };
  private edges: Record<string, boolean> = {};
  private release: { dx: number; dy: number; dur: number } | null = null;
  private keys = new Set<string>();
  private root: HTMLElement;
  private cleanup: (() => void)[] = [];
  private stickId = -1;
  private knob?: HTMLDivElement;
  private dragId = -1;
  cfg: Controls;

  constructor(root: HTMLElement, cfg: Controls) {
    this.root = root;
    this.cfg = cfg;
    this.build();
    const kd = (e: KeyboardEvent) => { this.keys.add(e.key.toLowerCase()); if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault(); };
    const ku = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    this.cleanup.push(() => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); });
  }

  private el(css: string, parent: HTMLElement = this.root) {
    const d = document.createElement("div");
    d.style.cssText = css;
    parent.appendChild(d);
    this.cleanup.push(() => d.remove());
    return d;
  }

  private build() {
    const base = "position:absolute;touch-action:none;user-select:none;-webkit-user-select:none;";
    if (this.cfg.mode === "move") {
      const pad = this.el(`${base}left:18px;bottom:22px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);backdrop-filter:blur(2px);`);
      this.knob = this.el(`position:absolute;left:41px;top:41px;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.7);box-shadow:0 2px 8px rgba(0,0,0,.4);`, pad);
      const move = (e: PointerEvent) => {
        const r = pad.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const l = Math.hypot(dx, dy);
        if (l > 1) { dx /= l; dy /= l; }
        this.x = dx; this.y = -dy;
        if (this.knob) this.knob.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
      };
      pad.addEventListener("pointerdown", (e) => { this.stickId = e.pointerId; pad.setPointerCapture(e.pointerId); move(e); });
      pad.addEventListener("pointermove", (e) => { if (e.pointerId === this.stickId) move(e); });
      const up = (e: PointerEvent) => { if (e.pointerId !== this.stickId) return; this.stickId = -1; this.x = 0; this.y = 0; if (this.knob) this.knob.style.transform = ""; };
      pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
    } else {
      const surf = this.el(`${base}inset:0;`);
      surf.style.zIndex = "1";
      surf.addEventListener("pointerdown", (e) => {
        if (this.dragId !== -1) return;
        this.dragId = e.pointerId; surf.setPointerCapture(e.pointerId);
        this.drag = { active: true, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now() };
      });
      surf.addEventListener("pointermove", (e) => { if (e.pointerId === this.dragId) { this.drag.x = e.clientX; this.drag.y = e.clientY; } });
      const up = (e: PointerEvent) => {
        if (e.pointerId !== this.dragId) return;
        this.dragId = -1;
        this.release = { dx: e.clientX - this.drag.x0, dy: e.clientY - this.drag.y0, dur: (performance.now() - this.drag.t0) / 1000 };
        this.drag.active = false;
      };
      surf.addEventListener("pointerup", up); surf.addEventListener("pointercancel", up);
    }
    const n = this.cfg.buttons.length;
    this.cfg.buttons.forEach((b, i) => {
      const size = n > 2 ? 64 : 76;
      const btn = this.el(`${base}right:${18 + (i % 2) * (size + 12)}px;bottom:${22 + Math.floor(i / 2) * (size + 12)}px;width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,200,60,.28);border:2px solid rgba(255,220,120,.8);color:#fff;font:700 13px/${size}px system-ui,sans-serif;text-align:center;z-index:3;text-shadow:0 1px 3px #000;`);
      btn.textContent = b.label;
      btn.addEventListener("pointerdown", (e) => { btn.setPointerCapture(e.pointerId); this.held[b.id] = true; this.edges[b.id] = true; btn.style.background = "rgba(255,200,60,.6)"; e.stopPropagation(); });
      const up = () => { this.held[b.id] = false; btn.style.background = "rgba(255,200,60,.28)"; };
      btn.addEventListener("pointerup", up); btn.addEventListener("pointercancel", up);
    });
  }

  /** call once per frame before reading: merges keyboard into the stick */
  poll() {
    if (this.stickId === -1 && this.cfg.mode === "move") {
      const k = this.keys;
      this.x = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
      this.y = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
    }
    this.cfg.buttons.forEach((b, i) => {
      const key = i === 0 ? " " : String(i + 1);
      if (this.keys.has(key) && !this.held[b.id]) { this.held[b.id] = true; this.edges[b.id] = true; }
      if (!this.keys.has(key) && this.held[b.id] && this.keysDown.has(b.id)) { this.held[b.id] = false; this.keysDown.delete(b.id); }
      if (this.keys.has(key)) this.keysDown.add(b.id);
    });
  }
  private keysDown = new Set<string>();

  /** true once each time the button goes down */
  pressed(id: string) { const v = !!this.edges[id]; this.edges[id] = false; return v; }
  /** returns (once) the finished drag gesture */
  takeRelease() { const r = this.release; this.release = null; return r; }
  /** test helper */
  simulateRelease(dx: number, dy: number, dur = 0.3) { this.release = { dx, dy, dur }; }
  dispose() { this.cleanup.forEach((f) => f()); this.cleanup = []; }
}
