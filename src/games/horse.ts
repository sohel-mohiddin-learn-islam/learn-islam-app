// Horse riding: steer a galloping horse down a track, jump hurdles and collect golden rings. 60 seconds.
import * as THREE from "three";
import { Game, addSun } from "./engine";
import type { GameCtx, Controls } from "./engine";
import { loadCharacter } from "./characters";
import type { Character } from "./characters";
import { S, C, clamp, rand, addMesh } from "./rig";
import { ground, sky, box, tree } from "./world";

interface Obj { m: THREE.Object3D; z: number; x: number; kind: "hurdle" | "ring"; used: boolean }
export class Horse extends Game {
  rider!: Character;
  horse = new THREE.Group();
  legs: { g: THREE.Group; lower: THREE.Group; phase: number }[] = [];
  neck = new THREE.Group();
  tail = new THREE.Group();
  objs: Obj[] = [];
  x = 0; z = 0; y = 0; vy = 0; speed = 8; stumble = 0;
  time = 60; score = 0; rings = 0; jumps = 0;
  t = 0; over = false;
  sun!: THREE.DirectionalLight;
  static controls(): Controls { return { mode: "move", buttons: [{ id: "jump", label: "JUMP" }], hint: "Steer left / right • tap JUMP over hurdles • grab golden rings" }; }
  async init() {
    const { scene, base, gender, kit } = this.ctx;
    sky(scene, 0x9ccdf2, 190);
    this.sun = addSun(scene, undefined, 35);
    ground(scene, 0x5ca852, 400, 1500, 0, 600);
    box(scene, 10, 0.02, 1500, 0xb99c6a, 0, 0.01, 600);
    for (let z = -20; z < 1300; z += 10) {
      box(scene, 0.15, 1.2, 0.15, 0xe9e1d0, -5.4, 0.6, z); box(scene, 0.15, 1.2, 0.15, 0xe9e1d0, 5.4, 0.6, z);
      box(scene, 0.08, 0.1, 10, 0xe9e1d0, -5.4, 1.0, z + 5); box(scene, 0.08, 0.1, 10, 0xe9e1d0, 5.4, 1.0, z + 5);
    }
    for (let z = -20; z < 1300; z += 14) { tree(scene, -rand(9, 26), z + rand(-4, 4), rand(0.9, 1.5)); tree(scene, rand(9, 26), z + rand(-4, 4), rand(0.9, 1.5)); }
    for (let z = 40; z < 1250; z += rand(26, 38)) this.addHurdle(z, rand(-3.3, 3.3));
    for (let z = 25; z < 1250; z += rand(14, 22)) this.addRing(z, rand(-4, 4));
    box(scene, 10.5, 0.1, 0.4, 0xffffff, 0, 0.05, 1260);
    this.buildHorse();
    scene.add(this.horse);
    this.rider = await loadCharacter(base, gender, kit);
    this.rider.root.scale.setScalar(0.98);
    this.horse.add(this.rider.root);
    this.rider.root.position.set(0, 0.62, -0.1);
    this.ctx.camera.fov = 58; this.ctx.camera.updateProjectionMatrix();
  }
  addHurdle(z: number, x: number) {
    const g = new THREE.Group();
    addMesh(g, new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), 0xffffff, -1.6, 0.55, 0); addMesh(g, new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), 0xffffff, 1.6, 0.55, 0);
    for (let i = 0; i < 3; i++) { const b = addMesh(g, new THREE.CylinderGeometry(0.05, 0.05, 3.3, 8), i % 2 ? 0xffffff : 0xd8342c, 0, 0.35 + i * 0.28, 0); b.rotation.z = Math.PI / 2; }
    g.position.set(x, 0, z); this.ctx.scene.add(g);
    this.objs.push({ m: g, z, x, kind: "hurdle", used: false });
  }
  addRing(z: number, x: number) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 10, 28), new THREE.MeshStandardMaterial({ color: 0xffc933, emissive: 0x6a4a00, roughness: 0.3, metalness: 0.7 }));
    m.position.set(x, 1.6, z); this.ctx.scene.add(m);
    this.objs.push({ m, z, x, kind: "ring", used: false });
  }
  buildHorse() {
    const h = this.horse; const col = 0x7a4a2a, dark = 0x2b1a10;
    const body = addMesh(h, new THREE.CapsuleGeometry(0.38, 1.1, 8, 16), col, 0, 1.12, 0); body.rotation.x = Math.PI / 2;
    this.neck.position.set(0, 1.35, 0.85); h.add(this.neck);
    const nk = addMesh(this.neck, new THREE.CapsuleGeometry(0.17, 0.62, 6, 12), col, 0, 0.3, 0.12); nk.rotation.x = 0.7;
    const head = addMesh(this.neck, new THREE.CapsuleGeometry(0.13, 0.42, 6, 12), col, 0, 0.62, 0.52); head.rotation.x = 1.9;
    addMesh(this.neck, new THREE.BoxGeometry(0.06, 0.5, 0.3), dark, 0, 0.5, -0.0).rotation.x = 0.6;
    addMesh(this.neck, new THREE.ConeGeometry(0.04, 0.14, 6), col, -0.09, 0.82, 0.38);
    addMesh(this.neck, new THREE.ConeGeometry(0.04, 0.14, 6), col, 0.09, 0.82, 0.38);
    this.tail.position.set(0, 1.25, -0.9); h.add(this.tail);
    addMesh(this.tail, new THREE.CapsuleGeometry(0.06, 0.55, 4, 8), dark, 0, -0.3, -0.08).rotation.x = -0.3;
    const pos: [number, number, number][] = [[-0.2, 0.7, 0.55], [0.2, 0.7, 0.55], [-0.2, 0.7, -0.6], [0.2, 0.7, -0.6]];
    pos.forEach((p, i) => {
      const g = new THREE.Group(); g.position.set(...p); h.add(g);
      addMesh(g, new THREE.CapsuleGeometry(0.1, 0.45, 4, 8), col, 0, -0.25, 0);
      const lower = new THREE.Group(); lower.position.set(0, -0.5, 0); g.add(lower);
      addMesh(lower, new THREE.CapsuleGeometry(0.07, 0.4, 4, 8), col, 0, -0.22, 0);
      addMesh(lower, new THREE.BoxGeometry(0.14, 0.1, 0.18), dark, 0, -0.47, 0.03);
      this.legs.push({ g, lower, phase: i < 2 ? (i ? 0.6 : 0) : (i === 2 ? 2.4 : 3.0) });
    });
    addMesh(h, new THREE.BoxGeometry(0.62, 0.07, 0.62), 0x8c1f1f, 0, 1.52, -0.1); // saddle cloth
  }
  update(dt: number) {
    const { input, hud, camera } = this.ctx;
    input.poll();
    if (this.over) return;
    this.t += dt; this.time -= dt;
    hud.set("Time", Math.max(0, Math.ceil(this.time))); hud.set("Score", Math.floor(this.score));
    if (this.time <= 0 || this.z > 1250) { this.over = true; hud.end("Ride finished!", `You scored ${Math.floor(this.score)} — ${this.jumps} jumps and ${this.rings} rings.`); return; }
    const target = 12 + Math.min(6, this.t * 0.1);
    this.speed += (target * (this.stumble > 0 ? 0.45 : 1) - this.speed) * Math.min(1, dt * 1.5);
    this.stumble -= dt;
    this.z += this.speed * dt;
    this.x = clamp(this.x - input.x * 7 * dt, -4.5, 4.5);
    if (input.pressed("jump") && this.y <= 0.001) { this.vy = 7.5; }
    this.vy -= 19 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (this.y === 0 && this.vy < 0) this.vy = 0;
    this.score += this.speed * dt * 0.1;
    for (const o of this.objs) {
      if (o.used || Math.abs(o.z - this.z) > 1.0) continue;
      if (o.kind === "hurdle" && Math.abs(o.x - this.x) < 1.9) {
        o.used = true;
        if (this.y > 0.75) { this.jumps++; this.score += 20; hud.toast("Great jump! +20", 700); }
        else { this.stumble = 1.2; this.score = Math.max(0, this.score - 10); hud.toast("Knocked the bar!", 800); o.m.rotation.x = -0.4; o.m.position.y = -0.2; }
      } else if (o.kind === "ring" && Math.abs(o.x - this.x) < 1.0 && Math.abs(1.6 - (this.y + 1.5)) < 1.0) {
        o.used = true; this.rings++; this.score += 10; o.m.visible = false;
      }
    }
    for (const o of this.objs) if (o.kind === "ring" && o.m.visible) o.m.rotation.y += dt * 3;
    // horse visuals
    this.horse.position.set(this.x, this.y, this.z);
    this.horse.rotation.y = clamp(input.x * 0.18, -0.2, 0.2) * -1;
    this.horse.rotation.z = input.x * 0.08;
    const gait = this.t * (7 + this.speed * 0.5);
    for (const l of this.legs) {
      const a = S(gait + l.phase);
      l.g.rotation.x = a * 0.8 - (this.y > 0.05 ? 0.5 : 0);
      l.lower.rotation.x = Math.max(0, -S(gait + l.phase + 1.2)) * 1.2 + (this.y > 0.05 ? 0.8 : 0);
    }
    this.horse.children[0].position.y = 1.12 + Math.abs(S(gait)) * 0.05;
    this.neck.rotation.x = -0.1 + S(gait) * 0.06; this.tail.rotation.x = 0.3 + S(gait * 0.5) * 0.15;
    this.poseRider(gait);
    // camera chase
    camera.position.set(this.x * 0.6, 3.4 + this.y * 0.5, this.z - 7.5);
    camera.lookAt(this.x * 0.7, 1.4, this.z + 8);
    this.sun.position.set(this.x + 15, 28, this.z + 10); this.sun.target.position.set(this.x, 0, this.z); this.sun.target.updateMatrixWorld();
  }
  poseRider(gait: number) {
    const r = this.rider; r.reset();
    r.rot("thigh_l", -1.15, 0, -0.35); r.rot("thigh_r", -1.15, 0, 0.35);
    r.rot("calf_l", 1.35, 0, 0); r.rot("calf_r", 1.35, 0, 0);
    const lean = 0.45 + (this.y > 0.05 ? 0.25 : 0);
    r.rot("spine_01", lean * 0.6, 0, 0); r.rot("spine_02", lean * 0.6, 0, 0);
    r.rot("upperarm_l", 0.7, 0, -0.55); r.rot("upperarm_r", 0.7, 0, 0.55);
    r.rot("lowerarm_l", 0.55, 0, 0); r.rot("lowerarm_r", 0.55, 0, 0);
    r.root.position.y = 0.6 + Math.abs(S(gait)) * 0.04;
    void C;
  }
}
