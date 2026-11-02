// The two three.js moments are the only rAF in the app (owner exception), and
// they stand down entirely for users who ask for reduced motion.
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
