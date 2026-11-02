// MOMENT 1: the winning tile drops in spinning and settles face-forward.
// An ivory face slab on a jade back slab (like a real tile) with the real tile
// art on its face, lit by a warm gold key. Scripted animation, no physics.
// Lazy chunk only.
import {
  CanvasTexture, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp01, createStage, easeOutQuart, runAnimation, shadowTexture } from './stage';
import { drawTileFace, FACE_H, FACE_W } from './tileArt';

// Tile body, in world units (1 = tile width).
const W = 1, H = 1.34, D = 0.6, R = 0.09;
const JADE_D = 0.36;
// Rest pose: a touch off square so the jade edge and ivory thickness read as 3D.
const REST_YAW = -0.2;
const DURATION = 1.4;
const DROP_FROM = 1.8;

interface Hooks {
  /** First frame is painted: safe to hide the CSS version. */
  ready: () => void;
  /** WebGL unavailable, art failed, or the context was lost: keep the CSS version. */
  fail: () => void;
}

/** Returns a dispose function. Never throws: failures go through hooks.fail(). */
export function mountWinTile(container: HTMLElement, tileIndex: number, hooks: Hooks): () => void {
  let disposed = false;
  let cancelAnim: (() => void) | null = null;

  let stage: ReturnType<typeof createStage>;
  try {
    stage = createStage(container, {
      fov: 24,
      direction: [0, 0.38, 1],
      target: [0, -0.04, 0],
      fit: [1.5, 1.7],
      envIntensity: 0.3,
      onLost: () => { dispose(); hooks.fail(); },
    });
  } catch {
    hooks.fail();
    return () => {};
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnim?.();
    stage.dispose();
  }

  drawTileFace(tileIndex).then(faceCanvas => {
    if (disposed) return;
    const { scene, render } = stage;

    // Warm gold key from upper left, soft jade-tinted bounce from below, thin rim.
    const key = new DirectionalLight(0xffe2b0, 2.0);
    key.position.set(-2.2, 3.2, 4);
    const rim = new DirectionalLight(0xc9a24b, 1.4);
    rim.position.set(3, 1, -3);
    scene.add(key, rim, new HemisphereLight(0xfff1d6, 0x2b4a3a, 0.8));

    const ivory = new MeshPhysicalMaterial({
      color: 0xfbf4e4, roughness: 0.34, clearcoat: 0.45, clearcoatRoughness: 0.3,
    });
    const jade = new MeshStandardMaterial({ color: 0x234231, roughness: 0.45, metalness: 0.05 });

    const tile = new Group();
    tile.rotation.order = 'YXZ';
    // Jade back slab (z < 0) and ivory face slab (z > 0) overlap a hair, so the
    // two rounded edges meet in a thin groove, as on a real two-layer tile.
    const back = new Mesh(new RoundedBoxGeometry(W, H, JADE_D, 4, R), jade);
    back.position.z = -D / 2 + JADE_D / 2;
    const front = new Mesh(new RoundedBoxGeometry(W, H, D - JADE_D + 0.03, 4, R), ivory);
    front.position.z = D / 2 - (D - JADE_D + 0.03) / 2;
    tile.add(back, front);

    const faceTex = new CanvasTexture(faceCanvas);
    faceTex.colorSpace = SRGBColorSpace;
    faceTex.anisotropy = 8;
    const face = new Mesh(
      new PlaneGeometry(0.84, (0.84 * FACE_H) / FACE_W),
      new MeshStandardMaterial({
        map: faceTex, transparent: true, roughness: 0.4, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      }),
    );
    face.position.z = D / 2 + 0.002;
    tile.add(face);
    scene.add(tile);

    // Fake contact shadow on the table under the tile.
    const shadow = new Mesh(
      new PlaneGeometry(1.9, 1.1),
      new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, side: DoubleSide }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -H / 2 - 0.01;
    scene.add(shadow);

    const pose = (t: number) => {
      // Fall (ease-in), then two shrinking hops, then rest.
      let y = 0;
      if (t < 0.55) { const s = t / 0.55; y = DROP_FROM * (1 - s * s); }
      else if (t < 0.8) { const s = (t - 0.55) / 0.25; y = 0.2 * 4 * s * (1 - s); }
      else if (t < 0.95) { const s = (t - 0.8) / 0.15; y = 0.045 * 4 * s * (1 - s); }
      // Two full turns about the vertical axis that decelerate to face-forward.
      const spin = REST_YAW - Math.PI * 4 * (1 - easeOutQuart(t / 1.0));
      // Leans in while falling, then rocks on its base after the first impact.
      const lean = -0.35 * (1 - clamp01(t / 0.55));
      const since = Math.max(0, t - 0.55);
      const rock = t >= DURATION ? 0 : 0.2 * Math.exp(-4.2 * since) * Math.cos(15 * since);
      tile.position.y = y;
      tile.rotation.set(lean + rock, spin, 0);
      shadow.scale.setScalar(1 + y * 0.12);
      (shadow.material as MeshBasicMaterial).opacity = 0.75 * clamp01(1 - y / 1.8);
      render();
    };

    pose(0);
    hooks.ready();
    cancelAnim = runAnimation(DURATION, pose, () => { cancelAnim = null; });
  }).catch(() => {
    if (disposed) return;
    dispose();
    hooks.fail();
  });

  return dispose;
}
