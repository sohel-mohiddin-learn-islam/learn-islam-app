// Swimming: a 50 m freestyle race. Tap the two stroke buttons ALTERNATELY (L, R, L, R…) as fast as you can.
import * as THREE from "three";
import { Game, addSun } from "./engine";
import type { GameCtx, Controls } from "./engine";
import { loadCharacter, KITS } from "./characters";
import type { Character } from "./characters";
import { S, clamp, rand, addMesh } from "./rig";
import { ground, sky, box } from "./world";

const LEN = 50;
interface Swimmer { ch: Character; z: number; v: number; ph: number; lane: number; t: number; fin: number; me: boolean }
export class Swim extends Game {
  sw: Swimmer[] = [];
  t = 0; go = 0; over = false;
  last = "";
  boost = 0;
  sun!: THREE.DirectionalLight;
  static controls(): Controls { return { mode: "tap", buttons: [{ id: "L", label: "◀ L" }, { id: "R", label: "R ▶" }], hint: "Tap L and R alternately — as fast as you can!" }; }
  async init() {
    const { scene, base, gender, kit } = this.ctx;
    sky(scene, 0xa9dcf5, 220);
    this.sun = addSun(scene, undefined, 45);
    ground(scene, 0xd9d2c3, 120, 140, 0, 25);
    // pool
    const water = new THREE.Mesh(new THREE.BoxGeometry(11, 1.6, LEN + 2), new THREE.MeshStandardMaterial({ color: 0x2aa3d8, transparent: true, opacity: 0.72, roughness: 0.1, metalness: 0.1 }));
    water.position.set(0, -0.77, LEN / 2); scene.add(water);
    box(scene, 11.6, 0.4, LEN + 2.6, 0x7fb9d6, 0, -1.7, LEN / 2);
    for (const x of [-5.7, 5.7]) box(scene, 0.4, 0.5, LEN + 2.6, 0xf3f3f3, x, -0.05, LEN / 2);
    for (const z of [-1.2, LEN + 1.2]) box(scene, 11.8, 0.5, 0.4, 0xf3f3f3, 0, -0.05, z);
    const lanes = [-3.75, -1.25, 1.25, 3.75];
    for (let i = 0; i <= 4; i++) {
      const x = -5 + i * 2.5;
      for (let z = 0; z < LEN; z += 2.5) { const c = addMesh(scene, new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8), (z / 2.5) % 2 ? 0xe2402e : 0xffffff, x, 0.02, z + 1.25, 0.4); c.rotation.x = Math.PI / 2; }
    }
    for (const x of lanes) { box(scene, 1.6, 0.02, 0.08, 0x1d2b4a, x, -1.58, 0); box(scene, 0.12, 0.02, LEN, 0x1d2b4a, x, -1.58, LEN / 2); }
    // finish
    for (let i = 0; i < 10; i++) box(scene, 1.1, 0.04, 0.4, i % 2 ? 0x111111 : 0xffffff, -5 + i * 1.1 + 0.55, 0.06, LEN + 0.4);
    // starting blocks + flags
    for (let i = 0; i < 4; i++) box(scene, 1, 0.5, 0.8, 0x8e949b, lanes[i], 0.3, -1.6);
    // seats
    for (let r = 0; r < 4; r++) box(scene, 3, 0.7, LEN + 4, r % 2 ? 0x2a6fb4 : 0xe8e8e8, -9 - r * 2.2, 0.35 + r * 0.7, LEN / 2);
    // swimmers
    const mine = 1;
    const kits = [KITS.white, kit, KITS.red, KITS.gold];
    for (let i = 0; i < 4; i++) {
      const me = i === mine;
      const g = me ? gender : (i % 2 ? "male" : "female");
      const ch = await loadCharacter(base, g as "male" | "female", me ? kit : kits[i]);
      ch.root.position.set(lanes[i], 0, 0);
      scene.add(ch.root);
      this.sw.push({ ch, z: 0, v: 0, ph: rand(0, 6), lane: lanes[i], t: 0, fin: 0, me });
    }
    this.ctx.camera.fov = 52; this.ctx.camera.updateProjectionMatrix();
  }
  update(dt: number) {
    const { input, hud, camera } = this.ctx;
    input.poll();
    this.t += dt;
    const me = this.sw[1];
    if (this.t < 3) hud.set("Race", this.t < 1 ? "Ready" : this.t < 2 ? "Set" : "GO!");
    const started = this.t > 2.5;
    if (started && !this.over) {
      for (const id of ["L", "R"]) if (input.pressed(id) && me.fin === 0) {
        if (id !== this.last) { this.boost += 1; this.last = id; } else this.boost += 0.15;
        me.ph += 0.9;
      }
      me.v = clamp(this.boost * 0.4, 0, 2.7);
      this.boost = Math.max(0, this.boost - dt * 3.2);
      me.v = Math.max(0.9, me.v);
    }
    this.sw.forEach((s, i) => {
      if (!started || s.fin) {
        if (s.fin) s.v *= 0.97; else s.v = 0;
      } else if (!s.me) {
        const base = [2.15, 0, 1.95, 2.0][i];
        s.v += (base * (0.9 + 0.2 * S(this.t * 0.7 + i)) - s.v) * dt * 2;
        s.ph += dt * s.v * 3.2;
      }
      s.z += s.v * dt;
      if (s.me) s.ph += dt * s.v * 2.4;
      if (!s.fin && s.z >= LEN) { s.fin = this.t - 2.5; s.t = s.fin; }
      s.ch.root.position.z = s.z; s.ch.root.position.y = -0.02 + (started ? S(s.ph * 0.5) * 0.02 : 0);
      this.stroke(s, started);
    });
    hud.set("Distance", Math.min(LEN, Math.floor(me.z)) + " m");
    const rank = 1 + this.sw.filter((o) => o !== me && o.z > me.z).length;
    hud.set("Place", rank + "/4");
    if (me.fin && !this.over) {
      this.over = true;
      const pos = 1 + this.sw.filter((o) => o !== me && o.fin && o.fin < me.fin).length;
      setTimeout(() => hud.end(pos === 1 ? "You won! 🥇" : pos === 2 ? "Silver! 🥈" : pos === 3 ? "Bronze! 🥉" : "Race finished", `Your time: ${me.fin.toFixed(1)} s for 50 m.`), 900);
    }
    const cz = me.z + 3;
    camera.position.set(6.8, 2.4, cz - 4.5);
    camera.lookAt(-1.2, 0, cz + 2.5);
    this.sun.position.set(10, 30, cz + 8); this.sun.target.position.set(0, 0, cz); this.sun.target.updateMatrixWorld();
  }
  stroke(s: Swimmer, started: boolean) {
    const c = s.ch; c.reset();
    c.root.rotation.set(Math.PI / 2, 0, 0);
    const ph = s.ph;
    const arm = (side: "l" | "r", p: number) => {
      const a = S(p);                 // -1..1
      const sw = 1.3 + 1.6 * a;       // swing from low (pull) to overhead (reach)
      c.rot("upperarm_" + side, started ? sw : 3.0, 0, 0);
      c.rot("lowerarm_" + side, started ? 0.5 + 0.5 * Math.max(0, -a) : 0.1, 0, 0);
    };
    arm("l", ph); arm("r", ph + Math.PI);
    const k = started ? 0.45 : 0;
    c.rot("thigh_l", k * S(ph * 2), 0, 0); c.rot("thigh_r", -k * S(ph * 2), 0, 0);
    c.rot("calf_l", 0.2 + 0.2 * k * (1 + S(ph * 2)), 0, 0); c.rot("calf_r", 0.2 + 0.2 * k * (1 - S(ph * 2)), 0, 0);
    c.rot("spine_02", -0.15, 0, 0); c.rot("neck_01", -0.2, 0, 0);
    c.rot("spine_03", 0, started ? 0.25 * S(ph) : 0, 0);
  }
}
