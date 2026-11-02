// MOMENT 2: three ivory dice tumble and settle on values the caller already
// drew. The animation never decides anything: every die is rotated to land with
// its drawn value on top, so the faces can never disagree with the total.
// Calm by design (no sparkle, no money, no celebration). Lazy chunk only.
import {
  CircleGeometry, DirectionalLight, DoubleSide, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Quaternion, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp01, createStage, easeOutCubic, runAnimation, shadowTexture } from './stage';

export type DiceValues = [number, number, number];

export interface DiceHandle {
  /** Tumbles to `values` (1-6 each); calls onLanded once the dice are at rest. */
  roll(values: DiceValues, onLanded: () => void): void;
  dispose(): void;
}

const SIZE = 1;
const REST_Y = SIZE / 2;
const REST_X = [-1.3, 0, 1.3];
const REST_Z = [0.06, -0.12, 0.1];
const STAGGER = 0.09;
const PER_DIE = 0.95;
const DROP_FROM = 2.2;

const RED = 0xb5392a;
const INK = 0x26201a;

const UP = new Vector3(0, 1, 0);
const AXIS_Y = new Vector3(0, 1, 0);

// Opposite faces sum to 7; 1-2-3 run counter-clockwise round a corner, as on a
// standard die. `rot` turns a face-local +Z (the face's outward normal) to that face.
const FACES: { value: number; normal: Vector3; rot: [number, number, number] }[] = [
  { value: 1, normal: new Vector3(0, 1, 0), rot: [-Math.PI / 2, 0, 0] },
  { value: 2, normal: new Vector3(0, 0, 1), rot: [0, 0, 0] },
  { value: 3, normal: new Vector3(1, 0, 0), rot: [0, Math.PI / 2, 0] },
  { value: 4, normal: new Vector3(-1, 0, 0), rot: [0, -Math.PI / 2, 0] },
  { value: 5, normal: new Vector3(0, 0, -1), rot: [0, Math.PI, 0] },
  { value: 6, normal: new Vector3(0, -1, 0), rot: [Math.PI / 2, 0, 0] },
];

const G = 0.235;
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-G, G], [G, -G]],
  3: [[-G, G], [0, 0], [G, -G]],
  4: [[-G, G], [G, G], [-G, -G], [G, -G]],
  5: [[-G, G], [G, G], [0, 0], [-G, -G], [G, -G]],
  6: [[-G, G], [G, G], [-G, 0], [G, 0], [-G, -G], [G, -G]],
};

interface Die {
  mesh: Object3D;
  shadow: Mesh;
}

interface Throw {
  start: Vector3[];
  axis: Vector3[];
  spin: number[];
  final: Quaternion[];
}

/** Throws if WebGL2 is unavailable: callers treat that as "show the CSS dice". */
export function createDiceStage(container: HTMLElement, hooks: { lost: () => void }): DiceHandle {
  let disposed = false;
  let cancelAnim: (() => void) | null = null;

  const stage = createStage(container, {
    fov: 28,
    direction: [0, 1, 0.5],
    target: [0, 0.2, 0],
    fit: [4.6, 2.3],
    envIntensity: 0.35,
    onLost: () => { dispose(); hooks.lost(); },
  });
  const { scene, render } = stage;

  const key = new DirectionalLight(0xfff0d8, 1.9);
  key.position.set(-2.5, 5, 3);
  scene.add(key, new HemisphereLight(0xfff3dc, 0x2a3a30, 0.7));

  const ivory = new MeshPhysicalMaterial({ color: 0xfbf4e4, roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const pipMat = (color: number) => new MeshStandardMaterial({
    color, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const redMat = pipMat(RED);
  const inkMat = pipMat(INK);
  const bigPip = new CircleGeometry(0.2, 40);
  const pip = new CircleGeometry(0.088, 32);
  const body = new RoundedBoxGeometry(SIZE, SIZE, SIZE, 4, 0.14);
  const blob = shadowTexture();
  const half = SIZE / 2 + 0.001;

  const dice: Die[] = REST_X.map((x) => {
    const mesh = new Object3D();
    mesh.add(new Mesh(body, ivory));
    for (const f of FACES) {
      const face = new Object3D();
      face.rotation.set(...f.rot);
      face.position.copy(f.normal).multiplyScalar(half);
      // 1 and 4 are red; the 1 is the big mahjong-style disc.
      for (const [px, py] of PIPS[f.value]) {
        const m = new Mesh(f.value === 1 ? bigPip : pip, f.value === 1 || f.value === 4 ? redMat : inkMat);
        m.position.set(px, py, 0);
        face.add(m);
      }
      mesh.add(face);
    }
    const shadow = new Mesh(
      new PlaneGeometry(1.7, 1.7),
      new MeshBasicMaterial({ map: blob, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide }),
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(mesh, shadow);
    mesh.position.set(x, DROP_FROM, -2);
    return { mesh, shadow };
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnim?.();
    stage.dispose();
  }

  const place = (th: Throw, T: number) => {
    dice.forEach((d, i) => {
      const t = clamp01((T - i * STAGGER) / PER_DIE) * PER_DIE;
      // Fall (ease-in), then two shrinking hops, then rest.
      let hop = 0;
      if (t < 0.52) { const s = t / 0.52; hop = DROP_FROM * (1 - s * s); }
      else if (t < 0.76) { const s = (t - 0.52) / 0.24; hop = 0.3 * 4 * s * (1 - s); }
      else if (t < 0.9) { const s = (t - 0.76) / 0.14; hop = 0.07 * 4 * s * (1 - s); }
      const glide = easeOutCubic(t / 0.55);
      const rest = new Vector3(REST_X[i], REST_Y, REST_Z[i]);
      d.mesh.position.lerpVectors(th.start[i], rest, glide).y = REST_Y + hop;
      // Remaining spin decays to nothing exactly as the die comes to rest.
      const left = th.spin[i] * (1 - easeOutCubic(t / 0.92));
      d.mesh.quaternion.setFromAxisAngle(th.axis[i], left).multiply(th.final[i]);
      d.shadow.position.set(d.mesh.position.x, 0.01, d.mesh.position.z);
      d.shadow.scale.setScalar(1 + hop * 0.15);
      (d.shadow.material as MeshBasicMaterial).opacity = 0.55 * clamp01(1 - hop / 2.4);
    });
    render();
  };

  const roll = (values: DiceValues, onLanded: () => void) => {
    if (disposed) return;
    cancelAnim?.();
    const th: Throw = { start: [], axis: [], spin: [], final: [] };
    values.forEach((v, i) => {
      const face = FACES[v - 1];
      // Value on top, then a small random turn about the vertical so no two rolls look alike.
      const align = new Quaternion().setFromUnitVectors(face.normal, UP);
      const yaw = new Quaternion().setFromAxisAngle(AXIS_Y, (Math.random() - 0.5) * 1.0);
      th.final.push(yaw.multiply(align));
      th.axis.push(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize());
      th.spin.push((1.25 + i * 0.35) * Math.PI * 2 * (i % 2 ? -1 : 1));
      th.start.push(new Vector3(REST_X[i] * 1.4, DROP_FROM, REST_Z[i] - 1.6));
    });
    cancelAnim = runAnimation(
      PER_DIE + STAGGER * (dice.length - 1),
      T => place(th, T),
      () => { cancelAnim = null; onLanded(); },
    );
  };

  return { roll, dispose };
}
