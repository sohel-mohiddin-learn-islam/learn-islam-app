// Archery: press and drag to aim (up/down/left/right), hold to draw, release to shoot. Watch the wind. 10 arrows.
import * as THREE from "three";
import { Game, addSun } from "./engine";
import type { GameCtx, Controls } from "./engine";
import { loadCharacter } from "./characters";
import type { Character } from "./characters";
import { idle, S, clamp, rand, addMesh } from "./rig";
import { ground, sky, box, treeLine } from "./world";

const DIST = 45;
export class Archery extends Game {
  archer!: Character;
  yaw = 0; pitch = 0;
  draw = 0;
  arrows = 10;
  score = 0;
  wind = 0;
  flying: { m: THREE.Group; v: THREE.Vector3 } | null = null;
  nocked!: THREE.Group;
  target!: THREE.Group;
  t = 0;
  wait = 0;
  done = false;
  sun!: THREE.DirectionalLight;
  static controls(): Controls { return { mode: "aim", buttons: [], hint: "Press & drag to aim • hold to draw • release to shoot" }; }
  crosshair = true;
  async init() {
    const { scene, base, gender, kit } = this.ctx;
    sky(scene, 0x93c8f3, 200);
    this.sun = addSun(scene, undefined, 40);
    ground(scene, 0x4aa04e, 300, 300, 0, 20);
    box(scene, 14, 0.02, 90, 0x58b25a, 0, 0.01, 22);
    treeLine(scene, [12, -12, 26, -26], 0, 80, 8);
    // target
    const tg = new THREE.Group();
    const rings = [0xffffff, 0x111111, 0x2a7fd6, 0xd8342c, 0xf6cf2f];
    for (let i = 0; i < 5; i++) {
      const r = 0.9 - i * 0.18;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08 + i * 0.004, 40), new THREE.MeshStandardMaterial({ color: rings[i], roughness: 0.8 }));
      m.rotation.x = Math.PI / 2; m.position.z = -i * 0.001; m.castShadow = true; tg.add(m);
    }
    addMesh(tg, new THREE.BoxGeometry(0.12, 1.5, 0.12), 0x6b4a2b, 0, -1.6, 0.1);
    addMesh(tg, new THREE.BoxGeometry(0.12, 1.5, 0.12), 0x6b4a2b, 0.0, -1.6, 0.1);
    tg.position.set(0, 1.55, DIST); this.target = tg; scene.add(tg);
    // archer
    this.archer = await loadCharacter(base, gender, kit);
    this.archer.root.position.set(0, 0, 0);
    this.archer.root.rotation.y = -Math.PI / 2;
    scene.add(this.archer.root);
    const bow = new THREE.Group();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) { const y = -0.62 + (1.24 * i) / 16; pts.push(new THREE.Vector3(0, y, 0.16 * (1 - Math.pow(y / 0.62, 2)))); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 8), new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.6 }));
    tube.castShadow = true; bow.add(tube);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.24, 4), new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }));
    bow.add(str); this.str = str;
    this.bowG = bow; scene.add(bow);
    this.nocked = new THREE.Group();
    addMesh(this.nocked, new THREE.CylinderGeometry(0.016, 0.016, 0.8, 6), 0xf3e2b0, 0, 0, 0).rotation.x = Math.PI / 2;
    addMesh(this.nocked, new THREE.ConeGeometry(0.02, 0.06, 8), 0x888888, 0, 0, 0.43).rotation.x = Math.PI / 2;
    scene.add(this.nocked);
    this.newWind();
    this.ctx.hud.set("Arrows", this.arrows);
  }
  bowG!: THREE.Group;
  str!: THREE.Mesh;
  newWind() { this.wind = rand(-2.5, 2.5); this.ctx.hud.set("Wind", (this.wind > 0 ? "→ " : "← ") + Math.abs(this.wind).toFixed(1)); }
  update(dt: number) {
    const { input, camera } = this.ctx;
    this.t += dt;
    if (this.done) return;
    const d = input.drag;
    const ready = !this.flying && this.wait <= 0 && this.arrows > 0;
    if (ready && d.active) {
      this.draw = Math.min(1, this.draw + dt * 1.3);
      this.yaw = clamp(-(d.x - d.x0) * 0.0004, -0.12, 0.12);
      this.pitch = clamp(-(d.y - d.y0) * 0.0003, -0.08, 0.08);
    } else if (!d.active) this.draw = Math.max(0, this.draw - dt * 3);
    const rel = input.takeRelease();
    if (rel && ready && this.draw > 0.25) this.shoot();
    else if (rel) this.draw = 0;
    this.wait -= dt;
    // hold = breathing sway, grows as the draw gets heavier (steadier when you aim calmly)
    const sway = this.draw * 0.5 + (d.active ? 0.1 : 0);
    this.swayX = 0.006 * sway * (Math.sin(this.t * 1.7) + 0.6 * Math.sin(this.t * 3.1 + 1));
    this.swayY = 0.005 * sway * (Math.sin(this.t * 2.3 + 2) + 0.6 * Math.sin(this.t * 4.1));
    // arrow flight
    if (this.flying) {
      const f = this.flying;
      f.v.x += this.wind * dt * 0.8; f.v.y -= 9.8 * dt; f.v.multiplyScalar(1 - 0.02 * dt);
      f.m.position.addScaledVector(f.v, dt);
      f.m.lookAt(f.m.position.clone().add(f.v));
      if (f.m.position.z >= DIST - 0.05) this.hit(f);
      else if (f.m.position.y < 0.05) { this.miss(f); }
    }
    this.pose();
    // nock position (follows the bow hand), then the aim angles measured from it so the crosshair == where the arrow flies
    const hl = new THREE.Vector3(); this.archer.bones["hand_l"].getWorldPosition(hl);
    const ox = hl.x, oy = hl.y, oz = hl.z - this.draw * 0.3;
    this.aimYaw = Math.atan2(this.target.position.x - ox, DIST - oz) + this.yaw + this.swayX;
    this.aimPitch = Math.atan2(this.target.position.y - oy, DIST - oz) + this.pitch + this.swayY;
    camera.fov = 42 - this.draw * 6; camera.updateProjectionMatrix();
    camera.position.set(-1.6, 1.8, -3.2);
    camera.lookAt(ox + Math.tan(this.aimYaw) * (DIST - oz), oy + Math.tan(this.aimPitch) * (DIST - oz), DIST);
    this.sun.position.set(14, 30, 6); this.sun.target.position.set(0, 0, 10); this.sun.target.updateMatrixWorld();
    this.nocked.visible = !this.flying && this.arrows > 0 && !this.done;
    this.bowG.position.set(hl.x, hl.y, hl.z);
    this.bowG.rotation.set(0, this.aimYaw, 0);
    this.str.position.set(0, 0, -this.draw * 0.35);
    this.nocked.position.set(ox, oy, oz);
    this.nocked.rotation.set(-(this.aimPitch + 0.06), this.aimYaw, 0);
  }
  aimYaw = 0; aimPitch = 0; swayX = 0; swayY = 0;
  pose() {
    const c = this.archer; idle(c, this.t);
    c.rot("upperarm_l", 0, 0, 1.3); c.rot("lowerarm_l", 0, 0, 0);
    c.rot("upperarm_r", 0, 0, 0.1); c.rot("lowerarm_r", 0.3 + 2.1 * this.draw, 0, 0);
    c.rot("spine_03", 0, 0.25 * this.draw, 0);
    c.rot("thigh_l", 0, 0, -0.1); c.rot("thigh_r", 0, 0, 0.1);
    c.root.rotation.y = -Math.PI / 2 + this.yaw * 0.5;
  }
  shoot() {
    const sp = 30 + 32 * this.draw;
    const g = new THREE.Group();
    addMesh(g, new THREE.CylinderGeometry(0.016, 0.016, 0.85, 6), 0xf3e2b0, 0, 0, 0).rotation.x = Math.PI / 2;
    addMesh(g, new THREE.ConeGeometry(0.03, 0.08, 8), 0x555555, 0, 0, 0.46).rotation.x = Math.PI / 2;
    addMesh(g, new THREE.BoxGeometry(0.1, 0.01, 0.12), 0xd9342b, 0, 0, -0.38);
    g.position.copy(this.nocked.position);
    const ap = this.aimPitch + 0.06;
    const v = new THREE.Vector3(Math.sin(this.aimYaw) * Math.cos(ap), Math.sin(ap), Math.cos(this.aimYaw) * Math.cos(ap)).multiplyScalar(sp);
    this.ctx.scene.add(g);
    this.flying = { m: g, v };
    this.arrows--; this.ctx.hud.set("Arrows", this.arrows);
    this.draw = 0;
  }
  hit(f: { m: THREE.Group; v: THREE.Vector3 }) {
    const p = f.m.position;
    const dx = p.x - this.target.position.x, dy = p.y - this.target.position.y;
    const r = Math.hypot(dx, dy);
    let pts = 0;
    if (r < 0.9) pts = Math.max(1, 10 - Math.floor(r / 0.09));
    p.z = DIST - 0.15; f.m.position.copy(p);
    if (pts) { f.m.lookAt(p.x + f.v.x * 0.01, p.y + f.v.y * 0.01, p.z + 1); }
    this.score += pts;
    this.ctx.hud.set("Score", this.score);
    this.ctx.hud.toast(pts === 10 ? "BULLSEYE! 🎯 +10" : pts ? `+${pts}` : "Missed the target", 1100);
    this.next();
  }
  miss(f: { m: THREE.Group; v: THREE.Vector3 }) {
    f.m.position.y = 0.05;
    this.ctx.hud.toast("Too short!", 900);
    this.next();
  }
  next() {
    this.flying = null; this.wait = 1.0; this.newWind();
    if (this.arrows <= 0) { this.done = true; setTimeout(() => this.ctx.hud.end(this.score >= 70 ? "Master archer!" : "Round complete", `You scored ${this.score} out of 100.`, this.score), 900); }
  }
}
void S;
