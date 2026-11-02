// Shared three.js plumbing for the two 3D moments (win tile, dice). This module
// and everything it imports ships ONLY in the lazy chunk: callers reach it via
// dynamic import(), never a static one, so three stays out of the main bundle.
//
// Rules this file enforces for both moments:
//  - every stage owns a brand-new <canvas> + renderer (never reuse a canvas:
//    React StrictMode's mount/unmount/mount force-loses a reused WebGL context)
//  - transparent canvas, pixel ratio capped at 2
//  - the render loop exists only while a scripted animation runs, then one
//    final render and it stops
//  - dispose() frees geometries, materials, textures, the env map, the
//    renderer and the GL context
import {
  CanvasTexture, PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer,
  type Material, type Mesh, type Texture, type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface Stage {
  readonly canvas: HTMLCanvasElement;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  /** Renders one frame (no loop). */
  render(): void;
  dispose(): void;
}

interface StageOptions {
  fov: number;
  /** Camera sits along this direction from `target`, far enough to fit `fit`. */
  direction: [number, number, number];
  target: [number, number, number];
  /** World-space box (width x height) that must stay fully in frame at any aspect. */
  fit: [number, number];
  /** Fraction of the room-environment light applied to PBR materials. */
  envIntensity: number;
  /** Fired once if the GL context is lost; the stage is unusable afterwards. */
  onLost: () => void;
}

/** Throws if WebGL2 is unavailable: callers treat that as "show the CSS version". */
export function createStage(container: HTMLElement, o: StageOptions): Stage {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (err) {
    canvas.remove();
    throw err;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(o.fov, 1, 0.1, 60);
  const target = new Vector3(...o.target);
  const dir = new Vector3(...o.direction).normalize();

  // Soft studio reflections so the ivory reads as glossy bone, not flat paint.
  const room = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const envRT: WebGLRenderTarget = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = o.envIntensity;
  pmrem.dispose();
  room.dispose();

  const fit = () => {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const half = Math.tan((o.fov * Math.PI) / 360);
    const dist = Math.max(o.fit[1] / (2 * half), o.fit[0] / (2 * half * camera.aspect));
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  };
  fit();

  let disposed = false;
  const render = () => { if (!disposed) renderer.render(scene, camera); };

  // Container resizes (rotation, 320 -> 375 widths) re-fit and repaint once.
  const ro = new ResizeObserver(() => { fit(); render(); });
  ro.observe(container);

  const onLost = (e: Event) => {
    e.preventDefault();
    if (!disposed) o.onLost();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ro.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    scene.traverse(node => {
      const m = node as Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) disposeMaterial(mat);
    });
    envRT.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  return { canvas, scene, camera, render, dispose };
}

function disposeMaterial(mat: Material): void {
  for (const v of Object.values(mat)) if ((v as Texture | null)?.isTexture) (v as Texture).dispose();
  mat.dispose();
}

/**
 * Scripted animation: calls frame(t seconds) every rAF until `duration`, ends on
 * an exact frame(duration), then done(). Returns a cancel function. A timer backs
 * the rAF so a hidden tab (rAF paused) still settles and fires done().
 */
export function runAnimation(duration: number, frame: (t: number) => void, done: () => void): () => void {
  let raf = 0;
  let start = 0;
  let live = true;
  const finish = () => {
    if (!live) return;
    live = false;
    cancelAnimationFrame(raf);
    clearTimeout(safety);
    frame(duration);
    done();
  };
  const safety = window.setTimeout(finish, duration * 1000 + 1200);
  const tick = (now: number) => {
    if (!live) return;
    if (!start) start = now;
    const t = (now - start) / 1000;
    if (t >= duration) { finish(); return; }
    frame(t);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { live = false; cancelAnimationFrame(raf); clearTimeout(safety); };
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeOutQuart = (x: number) => 1 - Math.pow(1 - clamp01(x), 4);

/** Soft radial blob used as a fake contact shadow (alpha-only, black). */
export function shadowTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}
