// Loads the provided male / female 3D characters, dresses them in modest sports kits (long sleeves, full-length trousers,
// head covering) and gives them a small procedural pose system (no baked animations are needed).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

export type Gender = "male" | "female";
export interface Kit {
  shirt: number;
  sleeves: number;
  pants: number;
  shoes: number;
  headcover: number; // hijab colour for the female character, cap colour for the male character
}

export const KITS: Record<string, Kit> = {
  green: { shirt: 0x1f8a4c, sleeves: 0x176b3a, pants: 0x14301f, shoes: 0xf2f2f2, headcover: 0xf5f5f0 },
  blue: { shirt: 0x2459c7, sleeves: 0x1b44a0, pants: 0x101c3c, shoes: 0xf2f2f2, headcover: 0xe9eefc },
  red: { shirt: 0xc72b2b, sleeves: 0x9d2020, pants: 0x2b0f0f, shoes: 0xf2f2f2, headcover: 0xfbeaea },
  white: { shirt: 0xf4f4f4, sleeves: 0xe2e2e2, pants: 0x2d3b55, shoes: 0x303030, headcover: 0xffffff },
  gold: { shirt: 0xe0a82e, sleeves: 0xb88619, pants: 0x1f1a10, shoes: 0xf2f2f2, headcover: 0xfff6dc },
  teal: { shirt: 0x138a86, sleeves: 0x0e6d6a, pants: 0x0c2a29, shoes: 0xf2f2f2, headcover: 0xe4f7f6 },
};

const cache: Partial<Record<Gender, Promise<{ scene: THREE.Group }>>> = {};
const texLoader = new THREE.TextureLoader();
const texCache: Record<string, Promise<THREE.Texture>> = {};

function tex(url: string, srgb: boolean): Promise<THREE.Texture> {
  const key = url + srgb;
  if (!texCache[key]) {
    texCache[key] = texLoader.loadAsync(url).then((t) => {
      t.flipY = false; // glTF UV convention
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
      return t;
    });
  }
  return texCache[key];
}

function loadRaw(base: string, g: Gender) {
  if (!cache[g]) {
    cache[g] = new Promise((resolve, reject) => new GLTFLoader().load(`${base}games/chars/${g}.gltf`, (gltf) => resolve({ scene: gltf.scene }), undefined, reject));
  }
  return cache[g]!;
}

/** garment group of a bone: 0 shirt, 1 sleeves, 2 trousers, 3 shoes, -1 bare skin */
function groupOf(name: string): number {
  const n = name.toLowerCase();
  if (n.startsWith("head") || n.startsWith("neck") || /^(index|middle|ring|pinky|thumb)/.test(n) || n.startsWith("hand")) return -1;
  if (n.startsWith("foot") || n.startsWith("ball")) return 3;
  if (n.startsWith("upperarm") || n.startsWith("lowerarm")) return 1;
  if (n.startsWith("clavicle") || n.startsWith("spine")) return 0;
  return 2; // pelvis, thigh, calf
}

/** per vertex: how much of it belongs to each garment (from the skin weights), so clothes get smooth clean edges */
function addCloth(mesh: THREE.SkinnedMesh) {
  const geo = mesh.geometry;
  if (geo.getAttribute("cloth")) return;
  const si = geo.getAttribute("skinIndex");
  const sw = geo.getAttribute("skinWeight");
  const bones = mesh.skeleton.bones;
  const grp = bones.map((b) => groupOf(b.name));
  const arr = new Float32Array(si.count * 4);
  for (let i = 0; i < si.count; i++) {
    const idx = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
    const w = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
    for (let k = 0; k < 4; k++) {
      const g = grp[idx[k]];
      if (g >= 0) arr[i * 4 + g] += w[k];
    }
  }
  geo.setAttribute("cloth", new THREE.BufferAttribute(arr, 4));
}

export class Character {
  root = new THREE.Group(); // move / rotate this
  bones: Record<string, THREE.Bone> = {};
  rest: Record<string, THREE.Quaternion> = {};
  height = 1.78;
  private tmp = new THREE.Quaternion();
  private e = new THREE.Euler();
  gender: Gender;
  model: THREE.Object3D;
  hijab?: THREE.Mesh;
  cap?: THREE.Mesh;
  constructor(gender: Gender, model: THREE.Object3D) {
    this.gender = gender;
    this.model = model;
    this.root.add(model);
    model.traverse((o) => {
      if ((o as THREE.Bone).isBone) {
        this.bones[o.name] = o as THREE.Bone;
        this.rest[o.name] = o.quaternion.clone();
      }
    });
  }
  /** back to the rest pose, then apply rot() calls each frame */
  reset() { for (const n in this.bones) this.bones[n].quaternion.copy(this.rest[n]); }
  /** add an extra rotation (radians) on top of the rest pose of a bone, in the bone's own axes */
  rot(name: string, x = 0, y = 0, z = 0) {
    const b = this.bones[name];
    if (!b) return;
    this.tmp.setFromEuler(this.e.set(x, y, z));
    b.quaternion.multiply(this.tmp);
  }
  /** attach an object (bat, stick, bow...) to a bone */
  attach(name: string, obj: THREE.Object3D) { this.bones[name]?.add(obj); }
}

export async function loadCharacter(base: string, gender: Gender, kit: Kit): Promise<Character> {
  const raw = await loadRaw(base, gender);
  const model = cloneSkinned(raw.scene) as THREE.Group;
  const ch = new Character(gender, model);
  const colors = {
    shirt: new THREE.Color(kit.shirt), sleeves: new THREE.Color(kit.sleeves), pants: new THREE.Color(kit.pants), shoes: new THREE.Color(kit.shoes),
  };
  const [skinMap, skinNormal, eyeMap] = await Promise.all([
    tex(`${base}games/chars/${gender}_base.webp`, true),
    tex(`${base}games/chars/${gender}_normal.webp`, false),
    tex(`${base}games/chars/eye.webp`, true),
  ]);

  model.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    m.frustumCulled = false;
    m.castShadow = true;
    const name = m.name.toLowerCase();
    if (name.includes("eyebrow")) {
      m.material = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.9 });
    } else if (name.includes("eye")) {
      m.material = new THREE.MeshStandardMaterial({ map: eyeMap, roughness: 0.3 });
    } else {
      addCloth(m);
      const mat = new THREE.MeshStandardMaterial({ map: skinMap, normalMap: skinNormal, roughness: 0.78, metalness: 0 });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uShirt = { value: colors.shirt };
        sh.uniforms.uSleeves = { value: colors.sleeves };
        sh.uniforms.uPants = { value: colors.pants };
        sh.uniforms.uShoes = { value: colors.shoes };
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", "#include <common>\nattribute vec4 cloth;\nvarying vec4 vCloth;")
          .replace("#include <begin_vertex>", `#include <begin_vertex>
            vCloth = cloth;
            float clothTot = cloth.x + cloth.y + cloth.z + cloth.w;
            transformed += objectNormal * ((0.022 * (cloth.x + cloth.y) + 0.016 * cloth.z + 0.012 * cloth.w) * smoothstep(0.35, 0.6, clothTot)); // loose, modest clothing`);
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", "#include <common>\nvarying vec4 vCloth;\nuniform vec3 uShirt; uniform vec3 uSleeves; uniform vec3 uPants; uniform vec3 uShoes;")
          .replace("#include <map_fragment>", `#include <map_fragment>
            float cTot = vCloth.x + vCloth.y + vCloth.z + vCloth.w;
            float cM = smoothstep(0.45, 0.55, cTot);
            float cMx = max(max(vCloth.x, vCloth.y), max(vCloth.z, vCloth.w));
            vec4 sel = step(cMx - 0.0001, vCloth);
            vec3 gar = (uShirt * sel.x + uSleeves * sel.y + uPants * sel.z + uShoes * sel.w) / max(dot(sel, vec4(1.0)), 1.0);
            gar *= 0.94 + 0.12 * dot(diffuseColor.rgb, vec3(0.3333));
            diffuseColor.rgb = mix(diffuseColor.rgb, gar, cM);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            normal = normalize(mix(normal, nonPerturbedNormal, cM * 0.85));`);
      };
      m.material = mat;
    }
  });

  // head covering
  const head = ch.bones["Head"] || ch.bones["head"];
  if (head) {
    if (gender === "female") {
      const mat = new THREE.MeshStandardMaterial({ color: kit.headcover, roughness: 0.92, side: THREE.DoubleSide });
      // a hijab: a dome and drape around the head, open at the front for the face
      const prof: [number, number][] = [[0.0, 0.142], [0.05, 0.137], [0.086, 0.118], [0.106, 0.082], [0.113, 0.03], [0.112, -0.03], [0.116, -0.09], [0.14, -0.14], [0.172, -0.19], [0.2, -0.245]];
      const pts = prof.map(([r, y]) => new THREE.Vector2(r, y));
      const gap = Math.PI * 0.56;
      const lathe = new THREE.LatheGeometry(pts, 30, gap / 2, Math.PI * 2 - gap); // opening faces +Z (the face)
      const hij = new THREE.Mesh(lathe, mat);
      hij.position.set(0, 0.112, -0.004);
      hij.scale.set(0.98, 1, 1.07);
      hij.castShadow = true;
      head.add(hij);
      ch.hijab = hij;
    } else {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.37),
        new THREE.MeshStandardMaterial({ color: kit.headcover, roughness: 0.85, side: THREE.DoubleSide })
      );
      cap.position.set(0, 0.118, -0.004);
      cap.scale.set(0.96, 1, 1.1);
      cap.castShadow = true;
      head.add(cap);
      ch.cap = cap;
    }
  }
  return ch;
}

