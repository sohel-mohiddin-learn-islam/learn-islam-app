import * as THREE from "three";
import { addMesh, rand } from "./rig";

export function ground(scene: THREE.Scene, color: number, w: number, d: number, cx = 0, cz = 0) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  g.rotation.x = -Math.PI / 2; g.position.set(cx, 0, cz); g.receiveShadow = true;
  scene.add(g);
  return g;
}
export function sky(scene: THREE.Scene, top = 0x7fb8ee, fogFar = 160) {
  scene.background = new THREE.Color(top);
  scene.fog = new THREE.Fog(top, 30, fogFar);
}
export function box(scene: THREE.Object3D, w: number, h: number, d: number, color: number, x: number, y: number, z: number) {
  return addMesh(scene, new THREE.BoxGeometry(w, h, d), color, x, y, z);
}
export function tree(scene: THREE.Object3D, x: number, z: number, s = 1) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.2 * s, 0.28 * s, 2 * s, 8), 0x6b4a2b, 0, 1 * s, 0);
  addMesh(g, new THREE.ConeGeometry(1.5 * s, 3.4 * s, 9), 0x2c7a3a, 0, 3.3 * s, 0);
  addMesh(g, new THREE.ConeGeometry(1.1 * s, 2.6 * s, 9), 0x358a44, 0, 4.7 * s, 0);
  g.position.set(x, 0, z);
  scene.add(g);
}
export function treeLine(scene: THREE.Object3D, xs: number[], z0: number, z1: number, step: number) {
  for (const x of xs) for (let z = z0; z < z1; z += step) tree(scene, x + rand(-2, 2), z + rand(-3, 3), rand(0.8, 1.4));
}
/** crowd stands made of coloured blocks */
export function stands(scene: THREE.Object3D, x: number, z0: number, z1: number, dir: number) {
  const cols = [0xd94b4b, 0x3f7fd6, 0xf2c84b, 0xffffff, 0x4fb36d];
  for (let r = 0; r < 4; r++) {
    const len = z1 - z0;
    box(scene, 3, 0.9, len, 0x8d939c, x + dir * (r * 1.6), 0.45 + r * 0.9, (z0 + z1) / 2);
    for (let z = z0; z < z1; z += 1.1) box(scene, 0.5, 0.7, 0.5, cols[Math.floor(Math.random() * cols.length)], x + dir * (r * 1.6) - dir * 0.3, 1.2 + r * 0.9, z);
  }
}
