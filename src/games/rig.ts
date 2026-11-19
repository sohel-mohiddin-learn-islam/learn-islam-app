// Pose helpers (conventions measured on the provided rig):
//  upperarm: x = swing forward(+)/back(-), z = raise (left +, right -); thigh: x = forward(-)/back(+); calf: x+ bends the knee;
//  lowerarm: x+ bends the elbow; spine: x+ leans forward, y twists; Head: z tilts.
import * as THREE from "three";
import type { Character } from "./characters";

export const S = Math.sin;
export const C = Math.cos;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function armsDown(c: Character, k = 1) {
  c.rot("upperarm_l", 0, 0, -1.3 * k);
  c.rot("upperarm_r", 0, 0, 1.3 * k);
}
export function idle(c: Character, t: number) {
  c.reset();
  armsDown(c);
  c.rot("lowerarm_l", 0.15, 0, 0);
  c.rot("lowerarm_r", 0.15, 0, 0);
  c.rot("spine_02", 0.03 + 0.015 * S(t * 2), 0, 0);
}
/** running cycle; sp 0..1 */
export function run(c: Character, t: number, sp: number) {
  c.reset();
  const a = S(t), b = S(t + Math.PI);
  const amp = 0.95 * sp;
  c.rot("thigh_l", -a * amp, 0, 0);
  c.rot("thigh_r", -b * amp, 0, 0);
  c.rot("calf_l", Math.max(0, S(t - 1.3)) * 1.5 * sp + 0.1, 0, 0);
  c.rot("calf_r", Math.max(0, S(t + Math.PI - 1.3)) * 1.5 * sp + 0.1, 0, 0);
  armsDown(c);
  c.rot("upperarm_l", -a * 0.8 * sp, 0, 0);
  c.rot("upperarm_r", -b * 0.8 * sp, 0, 0);
  c.rot("lowerarm_l", 0.4 + 0.9 * sp, 0, 0);
  c.rot("lowerarm_r", 0.4 + 0.9 * sp, 0, 0);
  c.rot("spine_02", 0.08 + 0.25 * sp, 0, 0);
  c.rot("spine_03", 0, a * 0.12 * sp, 0);
}
export function addMesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0, rough = 0.7) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: rough }));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
