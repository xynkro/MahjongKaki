import type { Transition, Variants } from 'framer-motion';

// Apple-TV-esque motion: smooth springs with a hint of overshoot, expo easing.
// Tuned per the 12 animation principles — slow-in/slow-out, weight, follow-through.

export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// snappy, tactile (buttons, small UI)
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 };
// gentle, weighty (panels, large elements) — a touch of overshoot
export const springSoft: Transition = { type: 'spring', stiffness: 190, damping: 24 };
// crisp (tile press / pop)
export const springStiff: Transition = { type: 'spring', stiffness: 520, damping: 30 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: springSoft },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring },
};

export function staggerContainer(stagger = 0.07, delayChildren = 0.04): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

// per-tab content transition
export const tabTransition: Transition = { duration: 0.3, ease: easeOutExpo };

// entrance delay for a tile at index i (capped so big grids don't lag the cascade)
export function tileEntrance(i: number): Transition {
  return { type: 'spring', stiffness: 440, damping: 30, mass: 0.8, delay: Math.min(i, 14) * 0.022 };
}
