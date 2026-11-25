// Football and field-hockey: dribble up the pitch, beat the defenders and score past the keeper in 60 seconds.
import * as THREE from "three";
import { Game, addSun } from "./engine";
import type { GameCtx, Controls } from "./engine";
import { loadCharacter, KITS } from "./characters";
import type { Character } from "./characters";
import { idle, run, S, clamp, rand, addMesh } from "./rig";
import { ground, sky, box, stands, treeLine } from "./world";

interface Foe { ch: Character; speed: number; stun: number; phase: number }

export class BallGame extends Game {
  hockey: boolean;
  player!: Character;
  keeper!: Character;
  foes: Foe[] = [];
  ball!: THREE.Mesh;
  bv = new THREE.Vector3();
  pv = new THREE.Vector3();
  heading = 0;
  phase = 0;
  kick = 0;
  score = 0;
  time = 60;
  over = false;
  resetT = 0;
  goalW: number;
  goalH: number;
  ballR: number;
  stick?: THREE.Group;
  shaft?: THREE.Mesh;
  head?: THREE.Mesh;
  cool = 0;
  static controls(hockey: boolean): Controls {
    return { mode: "move", buttons: [{ id: "shoot", label: hockey ? "HIT" : "SHOOT" }], hint: "Stick to run • " + (hockey ? "HIT" : "SHOOT") + " near the ball • beat the defenders and keeper" };
  }
  constructor(ctx: GameCtx, hockey: boolean) {
    super(ctx);
    this.hockey = hockey;
    this.goalW = hockey ? 3.66 : 7.32;
    this.goalH = hockey ? 2.14 : 2.44;
    this.ballR = hockey ? 0.07 : 0.22;
  }
  async init() {
    const { scene, base, gender, kit } = this.ctx;
    sky(scene, 0x8cc3f0, 170);
    const sun = addSun(scene, undefined, 40);
    this.sun = sun;
    ground(scene, this.hockey ? 0x2f8f6b : 0x3c9a46, 200, 200, 0, 10);
    // pitch markings
    const white = 0xffffff;
    box(scene, 40, 0.02, 0.15, white, 0, 0.01, 30); box(scene, 40, 0.02, 0.15, white, 0, 0.01, -12);
    box(scene, 0.15, 0.02, 42, white, -20, 0.01, 9); box(scene, 0.15, 0.02, 42, white, 20, 0.01, 9);
    box(scene, 40, 0.02, 0.15, white, 0, 0.01, 9);
    box(scene, 14, 0.02, 0.15, white, 0, 0.01, 24); box(scene, 0.15, 0.02, 6, white, -7, 0.01, 27); box(scene, 0.15, 0.02, 6, white, 7, 0.01, 27);
    // goal
    const gw = this.goalW, gh = this.goalH, gz = 30;
    box(scene, 0.12, gh, 0.12, white, -gw / 2, gh / 2, gz); box(scene, 0.12, gh, 0.12, white, gw / 2, gh / 2, gz); box(scene, gw + 0.12, 0.12, 0.12, white, 0, gh, gz);
    const net = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, 2), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 }));
    net.position.set(0, gh / 2, gz + 1); scene.add(net);
    stands(scene, 24, -8, 40, 1); stands(scene, -24, -8, 40, -1);
    treeLine(scene, [48, -48], -20, 60, 9);
    // ball
    this.ball = addMesh(scene, new THREE.SphereGeometry(this.ballR, 20, 14), this.hockey ? 0xf2c500 : 0xffffff, 0, this.ballR, 2, 0.5);
    // characters
    this.player = await loadCharacter(base, gender, kit);
    scene.add(this.player.root);
    const other = gender === "male" ? "female" : "male";
    this.keeper = await loadCharacter(base, other, KITS.gold);
    this.keeper.root.rotation.y = Math.PI;
    scene.add(this.keeper.root);
    for (let i = 0; i < 2; i++) {
      const ch = await loadCharacter(base, i % 2 ? "male" : other, KITS.red);
      ch.root.rotation.y = Math.PI;
      scene.add(ch.root);
      this.foes.push({ ch, speed: 2.6 + i * 0.5, stun: 0, phase: rand(0, 6) });
    }
    if (this.hockey) {
      const st = new THREE.Group();
      this.shaft = addMesh(st, new THREE.CylinderGeometry(0.02, 0.02, 1, 8), 0xd9b36a, 0, -0.5, 0);
      this.head = addMesh(st, new THREE.BoxGeometry(0.05, 0.07, 0.3), 0x222222, 0, -1, 0.08);
      scene.add(st);
      this.stick = st;
    }
    this.resetPlay();
  }
  sun!: THREE.DirectionalLight;
  resetPlay() {
    this.player.root.position.set(0, 0, 2);
    this.heading = 0;
    this.pv.set(0, 0, 0);
    this.bv.set(0, 0, 0);
    this.ball.position.set(0, this.ballR, 3.2);
    this.keeper.root.position.set(0, 0, 29.3);
    this.foes.forEach((f, i) => { f.ch.root.position.set(i ? 5 : -5, 0, 14 + i * 6); f.stun = 0; });
  }
  update(dt: number) {
    const { input, hud, camera } = this.ctx;
    if (this.over) return;
    this.time -= dt;
    hud.set("Time", Math.max(0, Math.ceil(this.time)));
    hud.set("Goals", this.score);
    if (this.time <= 0) { this.over = true; this.ctx.hud.end(this.score > 0 ? "Full time!" : "Full time", `You scored ${this.score} ${this.score === 1 ? "goal" : "goals"}.`, this.score); return; }
    const p = this.player.root.position;
    input.poll();
    if (this.resetT > 0) { this.resetT -= dt; if (this.resetT <= 0) this.resetPlay(); }
    // --- player movement (world x is mirrored because the camera looks toward +z)
    const mx = -input.x, mz = input.y;
    const mag = Math.min(1, Math.hypot(mx, mz));
    const speed = (this.hockey ? 6.2 : 6.8) * mag;
    if (mag > 0.1 && this.resetT <= 0) {
      const target = Math.atan2(mx, mz);
      let d = target - this.heading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.heading += d * Math.min(1, dt * 12);
      this.pv.set(Math.sin(this.heading) * speed, 0, Math.cos(this.heading) * speed);
    } else this.pv.multiplyScalar(0.8);
    p.x = clamp(p.x + this.pv.x * dt, -19, 19);
    p.z = clamp(p.z + this.pv.z * dt, -11, 29);
    this.player.root.rotation.y = this.heading;
    this.phase += dt * (6 + speed * 1.2);
    // --- ball
    const b = this.ball.position;
    this.cool -= dt;
    const dx = b.x - p.x, dz = b.z - p.z, dist = Math.hypot(dx, dz);
    if (input.pressed("shoot") && this.cool <= 0) {
      this.kick = 0.35;
      this.cool = 0.5;
    }
    if (this.kick > 0) {
      this.kick -= dt;
      if (this.kick < 0.22 && this.kick > 0.15 && dist < 1.8 && this.resetT <= 0) this.strike(dx, dz);
    }
    const dribbling = dist < 1.1 && this.cool <= 0 && this.resetT <= 0 && b.y < this.ballR + 0.1;
    if (dribbling) {
      const tx = p.x + Math.sin(this.heading) * 0.75, tz = p.z + Math.cos(this.heading) * 0.75;
      b.x += (tx - b.x) * Math.min(1, dt * 14); b.z += (tz - b.z) * Math.min(1, dt * 14);
      this.bv.set(this.pv.x, 0, this.pv.z);
    } else {
      this.bv.y -= 24 * dt;
      b.addScaledVector(this.bv, dt);
      if (b.y < this.ballR) { b.y = this.ballR; this.bv.y = -this.bv.y * (this.hockey ? 0.1 : 0.55); if (Math.abs(this.bv.y) < 1) this.bv.y = 0; }
      const fr = b.y <= this.ballR + 0.01 ? (this.hockey ? 0.6 : 0.8) : 0.995;
      const k = Math.pow(fr, dt * 4);
      this.bv.x *= k; this.bv.z *= k;
      this.ball.rotation.x += this.bv.z * dt / this.ballR;
      this.ball.rotation.z -= this.bv.x * dt / this.ballR;
    }
    // walls / sidelines keep the ball in play
    if (b.x > 19.5) { b.x = 19.5; this.bv.x *= -0.5; }
    if (b.x < -19.5) { b.x = -19.5; this.bv.x *= -0.5; }
    if (b.z < -11.5) { b.z = -11.5; this.bv.z *= -0.5; }
    // goal / save / end line
    if (b.z > 29.9 && this.resetT <= 0) {
      if (Math.abs(b.x) < this.goalW / 2 && b.y < this.goalH && !this.saved) { this.goal(); }
      else if (b.z > 31.4 || Math.abs(b.x) >= this.goalW / 2) { b.z = 29.8; this.bv.z = -Math.abs(this.bv.z) * 0.4; }
    }
    if (b.z > 31.5 && this.resetT <= 0) { b.z = 31.4; this.bv.set(0, 0, 0); }
    // --- keeper
    const k = this.keeper;
    const want = clamp(b.x, -this.goalW / 2 + 0.5, this.goalW / 2 - 0.5);
    const incoming = this.bv.z > 6 && b.z > 14;
    const ks = incoming ? 6.5 : 2.3;
    k.root.position.x += clamp(want - k.root.position.x, -ks * dt, ks * dt);
    k.root.position.z = 29.4;
    const kd = Math.hypot(b.x - k.root.position.x, b.z - k.root.position.z);
    this.saved = false;
    if (kd < 1.05 && b.y < 2.3 && this.bv.z > 0 && this.resetT <= 0 && b.z < 30.2) {
      this.bv.z = -Math.abs(this.bv.z) * 0.6 - 3; this.bv.x += rand(-4, 4); this.saved = true;
      hud.toast("Saved by the keeper!", 900);
    }
    // --- defenders
    for (const f of this.foes) {
      const fp = f.ch.root.position;
      f.stun -= dt;
      let tx = b.x, tz = b.z;
      if (dribbling) { tx = p.x; tz = p.z; }
      const ddx = tx - fp.x, ddz = tz - fp.z, dd = Math.hypot(ddx, ddz) || 1;
      if (f.stun <= 0 && this.resetT <= 0) {
        fp.x += (ddx / dd) * f.speed * dt; fp.z += (ddz / dd) * f.speed * dt;
        f.ch.root.rotation.y = Math.atan2(ddx, ddz);
        f.phase += dt * 9;
        run(f.ch, f.phase, 0.7);
      } else idle(f.ch, f.phase += dt);
      // tackle
      const fb = Math.hypot(b.x - fp.x, b.z - fp.z);
      if (fb < 0.9 && f.stun <= 0 && this.resetT <= 0) {
        f.stun = 1.4; this.cool = 0.6;
        const a = rand(-1, 1);
        this.bv.set(Math.sin(a) * 6, 0, -6);
        hud.toast("Tackled!", 700);
      }
    }
    // --- visuals
    if (mag > 0.15 || this.resetT > 0 && false) run(this.player, this.phase, clamp(speed / 6.8, 0.2, 1));
    else idle(this.player, this.phase);
    if (this.kick > 0) {
      const t = 1 - this.kick / 0.35;
      if (this.hockey) {
        this.player.rot("spine_02", 0.3, 0.5 * S(t * Math.PI) * 1.2, 0);
        this.player.rot("upperarm_r", 0.9, 0, 0.4); this.player.rot("upperarm_l", 0.9, 0, -0.4);
      } else {
        this.player.rot("thigh_r", 0.8 - 2.6 * S(t * Math.PI), 0, 0);
        this.player.rot("calf_r", 1.3 * (1 - S(t * Math.PI)), 0, 0);
      }
    } else if (this.hockey) {
      this.player.rot("spine_02", 0.35, 0, 0);
      this.player.rot("upperarm_r", 0.8, 0, 0.3); this.player.rot("upperarm_l", 0.8, 0, -0.3);
      this.player.rot("lowerarm_r", 0.4, 0, 0);
    }
    this.keeperPose(dt, incoming);
    if (this.hockey) this.placeStick();
    // camera
    const cx = p.x * 0.7, cz = p.z - 8.5;
    camera.position.x += (cx - camera.position.x) * Math.min(1, dt * 4);
    camera.position.z += (cz - camera.position.z) * Math.min(1, dt * 4);
    camera.position.y = 4.6;
    camera.lookAt(p.x * 0.8, 1.1, p.z + 7);
    this.sun.position.set(p.x + 18, 30, p.z + 12);
    this.sun.target.position.set(p.x, 0, p.z);
    this.sun.target.updateMatrixWorld();
  }
  placeStick() {
    const st = this.stick!, p = this.player.root.position;
    this.player.root.updateMatrixWorld(true);
    const hr = new THREE.Vector3(), hl = new THREE.Vector3();
    this.player.bones["hand_r"].getWorldPosition(hr); this.player.bones["hand_l"].getWorldPosition(hl);
    const grip = hr.add(hl).multiplyScalar(0.5);
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    const b = this.ball.position;
    const tip = new THREE.Vector3();
    const t = this.kick > 0 ? 1 - this.kick / 0.35 : -1;
    if (t >= 0) {
      const sweep = (t - 0.5) * 2; // -1 .. 1 : back → through the ball
      tip.set(b.x + fx * sweep * 1.0, 0.03 + 0.55 * Math.max(0, 1 - Math.abs(sweep) * 1.6), b.z + fz * sweep * 1.0);
    } else {
      tip.set(p.x + fx * 0.8, 0.03, p.z + fz * 0.8);
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      if (d < 1.6) { tip.x = b.x - fx * 0.12; tip.z = b.z - fz * 0.12; }
    }
    const dir = tip.clone().sub(grip);
    const len = Math.max(0.5, dir.length());
    st.position.copy(grip);
    st.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    this.shaft!.scale.y = len; this.shaft!.position.y = -len / 2;
    this.head!.position.y = -len;
  }
  saved = false;
  kt = 0;
  keeperPose(dt: number, incoming: boolean) {
    this.kt += dt;
    const k = this.keeper;
    k.reset();
    k.rot("upperarm_l", 0, 0, incoming ? 0.2 : -0.5); k.rot("upperarm_r", 0, 0, incoming ? -0.2 : 0.5);
    k.rot("upperarm_l", 0.5, 0, 0); k.rot("upperarm_r", 0.5, 0, 0);
    k.rot("lowerarm_l", 0.6, 0, 0); k.rot("lowerarm_r", 0.6, 0, 0);
    k.rot("spine_02", 0.25, 0, 0);
    k.rot("thigh_l", -0.35, 0, -0.12); k.rot("thigh_r", -0.35, 0, 0.12);
    k.rot("calf_l", 0.6, 0, 0); k.rot("calf_r", 0.6, 0, 0);
    k.root.position.y = -0.04 + 0.03 * S(this.kt * 5);
  }
  strike(dx: number, dz: number) {
    const p = this.player.root.position;
    void p;
    const gw = this.goalW;
    const tx = Math.abs(this.ctx.input.x) > 0.2 ? clamp(-this.ctx.input.x, -1, 1) * gw * 0.42 : (this.keeper.root.position.x > 0 ? -1 : 1) * gw * 0.38;
    const dirx = tx - this.ball.position.x, dirz = 30 - this.ball.position.z;
    const l = Math.hypot(dirx, dirz) || 1;
    const sp = this.hockey ? 27 : 24;
    this.bv.set((dirx / l) * sp, this.hockey ? 0 : clamp(4 + (30 - p.z) * 0.1, 3, 7), (dirz / l) * sp);
    this.ball.position.y = this.ballR + 0.05;
    this.cool = 0.5;
  }
  goal() {
    this.score++;
    this.ctx.hud.toast("GOAL! ⚽", 1400);
    this.resetT = 1.6;
    this.bv.multiplyScalar(0.2);
  }
}
