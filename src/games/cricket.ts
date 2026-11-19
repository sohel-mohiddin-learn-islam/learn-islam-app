// Cricket: face a bowler, time your SWING. 12 balls, 3 wickets.
import * as THREE from "three";
import { Game, addSun } from "./engine";
import type { GameCtx, Controls } from "./engine";
import { loadCharacter, KITS } from "./characters";
import type { Character } from "./characters";
import { idle, run, armsDown, S, C, clamp, rand, addMesh } from "./rig";
import { ground, sky, box, stands, treeLine } from "./world";

export class Cricket extends Game {
  bat!: Character;
  bowler!: Character;
  ball!: THREE.Mesh;
  bv = new THREE.Vector3();
  state: "wait" | "run" | "flight" | "hit" | "result" = "wait";
  t = 1.2;
  balls = 12;
  wickets = 0;
  runs = 0;
  swing = 0;
  swung = false;
  runT = 0;
  tt = 0;
  bounced = false;
  sun!: THREE.DirectionalLight;
  static controls(): Controls { return { mode: "move", buttons: [{ id: "swing", label: "SWING" }], hint: "Stick: move the batter & choose the shot side (up = lofted) • tap SWING as the ball arrives — swing as often as you like" }; }
  async init() {
    const { scene, base, gender, kit } = this.ctx;
    sky(scene, 0x86bff0, 190);
    this.sun = addSun(scene, undefined, 50);
    ground(scene, 0x3f9a48, 300, 300, 0, 0);
    box(scene, 3.05, 0.03, 22.5, 0xcfb58a, 0, 0.015, 10);
    for (const z of [-0.9, 19.3]) for (const x of [-0.12, 0, 0.12]) box(scene, 0.035, 0.72, 0.035, 0xf1e3b0, x, 0.36, z);
    box(scene, 2.6, 0.02, 0.06, 0xffffff, 0, 0.04, 1.2);
    // boundary rope and stands
    const rope = new THREE.Mesh(new THREE.TorusGeometry(40, 0.12, 6, 90), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    rope.rotation.x = Math.PI / 2; rope.position.set(0, 0.1, 10); scene.add(rope);
    stands(scene, 44, -10, 30, 1); stands(scene, -44, -10, 30, -1);
    treeLine(scene, [75, -75], -30, 60, 10);
    this.ball = addMesh(scene, new THREE.SphereGeometry(0.055, 14, 10), 0xb3202a, 0, 1, 18, 0.4);
    this.ball.visible = false;
    this.bat = await loadCharacter(base, gender, kit);
    this.bat.root.position.set(0.55, 0, 0.6);
    this.bat.root.rotation.y = Math.PI / 2;
    scene.add(this.bat.root);
    const bowlerG = gender === "male" ? "male" : "male";
    this.bowler = await loadCharacter(base, bowlerG, KITS.white);
    this.bowler.root.rotation.y = Math.PI;
    this.bowler.root.position.set(0.5, 0, 33);
    idle(this.bowler, 0);
    scene.add(this.bowler.root);
    // bat in hand
    const bat = new THREE.Group();
    addMesh(bat, new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8), 0x2a2a2a, 0, -0.1, 0);
    const blade = addMesh(bat, new THREE.BoxGeometry(0.11, 0.62, 0.045), 0xe3c58d, 0, -0.55, 0);
    blade.rotation.z = 0;
    this.batMesh = bat;
    scene.add(bat);
    this.ctx.camera.fov = 50; this.ctx.camera.updateProjectionMatrix();
    this.ctx.camera.position.set(-1.2, 2.3, -5.8);
    this.ctx.camera.lookAt(0, 1.0, 12);
  }
  batMesh!: THREE.Group;
  bowl() {
    this.balls--;
    this.state = "run"; this.runT = 0; this.swung = false; this.bounced = false; this.swing = 0;
    this.ctx.hud.set("Balls", this.balls);
  }
  release() {
    const b = this.ball;
    const x0 = rand(0.3, 0.7), z0 = 19.5, y0 = 2.15;
    const zb = rand(5, 9.5), xb = rand(-0.35, 0.35);
    const vz = -rand(19, 27);
    const T1 = (z0 - zb) / -vz;
    b.position.set(x0, y0, z0);
    this.bv.set((xb - x0) / T1, (0.5 * 9.8 * T1 * T1 - y0) / T1, vz);
    b.visible = true;
    this.state = "flight"; this.tt = 0;
  }
  update(dt: number) {
    const { input, hud } = this.ctx;
    input.poll();
    this.tt += dt;
    if (this.state !== "result") {
      const bp = this.bat.root.position;
      bp.x = clamp(bp.x - input.x * 2.4 * dt, -1.0, 1.9);
      bp.z = clamp(bp.z + input.y * 2.4 * dt, -0.5, 1.8);
    }
    hud.set("Runs", this.runs); hud.set("Wickets", this.wickets + "/3");
    if (this.state === "wait") {
      this.t -= dt;
      this.stance(dt);
      if (this.t <= 0) { if (this.balls <= 0 || this.wickets >= 3) { this.finish(); this.state = "result"; this.t = 99; } else this.bowl(); }
    }
    if (this.state === "run") {
      this.runT += dt;
      const k = clamp(this.runT / 2.1, 0, 1);
      this.bowler.root.position.set(0.5, 0, 33 - 14 * k);
      if (k < 1) { this.bowler.root.rotation.y = Math.PI; run(this.bowler, this.runT * 9, 0.8); }
      else { this.bowlerThrow((this.runT - 2.1) / 0.35); if (this.runT > 2.1 + 0.18 && !this.ball.visible) this.release(); if (this.runT > 2.6) this.state = "flight"; }
      this.stance(dt);
      this.readSwing(dt);
    }
    if (this.state === "flight" || this.state === "hit") {
      this.stance(dt);
      this.readSwing(dt);
      this.stepBall(dt);
      if (this.bowler.root.position.z < 40 && this.tt > 0.35) { this.bowlerPose(dt); }
    }
    if (this.state === "result") { this.stance(dt); }
    // camera slightly follows the ball in flight
    const cam = this.ctx.camera;
    cam.position.set(-1.2, 2.3, -5.8);
    const lz = this.ball.visible && this.state === "flight" ? 10 + clamp(this.ball.position.z, -2, 18) * 0.3 : 10;
    cam.lookAt(0, 1.0, lz);
  }
  bowlerPose(dt: number) { idle(this.bowler, this.tt); void dt; }
  bowlerThrow(k: number) {
    const b = this.bowler; b.reset(); armsDown(b);
    const a = clamp(k, 0, 1) * Math.PI * 2;
    b.rot("upperarm_r", -a - 0.4, 0, -0.1); b.rot("upperarm_l", 0.8, 0, 0.3);
    b.rot("spine_02", 0.3 * S(a / 2), 0, 0);
    b.rot("thigh_l", -0.6, 0, 0); b.rot("thigh_r", 0.3, 0, 0);
  }
  readSwing(dt: number) {
    if (input_pressed(this.ctx) && this.swing === 0) { this.swing = 0.0001; this.contactDone = false; this.shotX = -this.ctx.input.x; this.shotY = this.ctx.input.y; }
    if (this.swing > 0) this.swing += dt;
    if (this.swing > 0.14 && !this.contactDone) { this.contactDone = true; this.contact(); }
    if (this.swing > 0.6) this.swing = 0;
  }
  contactDone = false;
  shotX = 0; shotY = 0;
  contact() {
    if (this.state !== "flight") return;
    const b = this.ball.position;
    const bp = this.bat.root.position;
    const dz = b.z - (bp.z + 0.1);
    if (Math.abs(dz) < 1.25 && b.y < 1.9 && Math.abs(b.x - (bp.x - 0.15)) < 1.0) {
      const q = 1 - Math.abs(dz) / 1.25;
      const ang = clamp(-dz * 0.6 + this.shotX * 0.7, -1.4, 1.4); // late → off side, early → leg side
      const sp = 12 + 22 * q;
      this.bv.set(Math.sin(ang) * sp * 0.9, (q > 0.5 ? 3 + 7 * Math.max(0, this.shotY + 0.3) : 1) + rand(0, 2), Math.cos(ang) * sp + 4);
      this.state = "hit"; this.tt = 0; this.bounced = false; this.landed = 0; this.maxd = 0;
      this.ctx.hud.toast(q > 0.8 ? "Perfect timing!" : q > 0.5 ? "Good shot" : "Edged!", 800);
    }
  }
  landed = 0;
  maxd = 0;
  stepBall(dt: number) {
    const b = this.ball.position;
    this.bv.y -= 9.8 * dt;
    b.addScaledVector(this.bv, dt);
    if (b.y < 0.055) {
      b.y = 0.055; this.bv.y = Math.abs(this.bv.y) * 0.6;
      this.bv.x *= 0.85; this.bv.z *= 0.85;
      if (this.state === "hit" && !this.bounced) { this.bounced = true; this.landed = Math.hypot(b.x, b.z - 10); }
    }
    const d = Math.hypot(b.x, b.z - 10);
    this.maxd = Math.max(this.maxd, d);
    if (this.state === "flight") {
      // stumps behind the batter
      if (b.z < -0.85 && b.z > -1.1 && Math.abs(b.x) < 0.17 && b.y < 0.72) { this.out("BOWLED!"); return; }
      if (b.z < -6) { this.endBall(0, "Dot ball"); }
    } else if (this.state === "hit") {
      if (d > 40 && !this.bounced) { this.endBall(6, "SIX! 🎉"); }
      else if (d > 40) { this.endBall(4, "FOUR!"); }
      else if (this.bounced && Math.hypot(this.bv.x, this.bv.z) < 3.2) { this.endBall(this.maxd > 25 ? 3 : this.maxd > 14 ? 2 : 1, ""); }
      else if (this.tt > 5) this.endBall(1, "");
    }
  }
  endBall(r: number, msg: string) {
    this.runs += r;
    this.ball.visible = false; this.state = "wait"; this.t = 1.6;
    this.ctx.hud.toast(msg || (r + (r === 1 ? " run" : " runs")), 1100);
    this.bowler.root.position.set(0.5, 0, 33);
  }
  out(msg: string) {
    this.wickets++;
    this.ball.visible = false; this.state = "wait"; this.t = 1.8;
    this.ctx.hud.toast(msg, 1400);
    this.bowler.root.position.set(0.5, 0, 33);
  }
  finish() {
    this.ctx.hud.end(this.runs >= 20 ? "What an innings!" : "Innings over", `You scored ${this.runs} runs${this.wickets ? ` and lost ${this.wickets} wicket${this.wickets > 1 ? "s" : ""}` : ""}.`);
  }
  stance(dt: number) {
    const c = this.bat; c.reset(); armsDown(c);
    c.rot("spine_02", 0.35, 0, 0); c.rot("spine_03", 0.1, 0, 0);
    c.rot("thigh_l", -0.25, 0, -0.18); c.rot("thigh_r", -0.25, 0, 0.18);
    c.rot("calf_l", 0.5, 0, 0); c.rot("calf_r", 0.5, 0, 0);
    let a = 0;
    if (this.swing > 0) a = clamp(this.swing / 0.24, 0, 1);
    c.rot("upperarm_l", 0.95 + 0.3 * a, 0, 0.15); c.rot("upperarm_r", 0.95 + 0.3 * a, 0, -0.15);
    c.rot("lowerarm_l", 0.55, 0, 0); c.rot("lowerarm_r", 0.55, 0, 0);
    c.rot("spine_03", 0, -0.9 * a, 0); c.rot("spine_02", 0, -0.4 * a, 0);
    c.root.rotation.y = Math.PI / 2 + 0.25 * a;
    c.root.updateMatrixWorld(true);
    const hr = new THREE.Vector3(), hl = new THREE.Vector3();
    c.bones["hand_r"].getWorldPosition(hr); c.bones["hand_l"].getWorldPosition(hl);
    hr.add(hl).multiplyScalar(0.5);
    this.batMesh.position.copy(hr);
    const th = this.swing > 0 ? 1.6 - 3.0 * a : this.idleBack ;
    this.batMesh.rotation.set(th, 0, 0);
    void dt;
  }
  idleBack = -0.25;
}
function input_pressed(ctx: GameCtx) { return ctx.input.pressed("swing"); }
void C;
