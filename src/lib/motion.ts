import { Transition, Variants, useReducedMotion } from 'motion/react';

/**
 * NINETIES SHOTS — Cinematic Motion Tokens
 * Aesthetic: Quiet Luxury + Editorial Photography + Fashion Film
 * 
 * Easing: Custom cubic-bezier deceleration curve that mimics high-end camera pans and film cuts.
 * No bounce, no harsh springiness, no excessive travel.
 */

// Deceleration curve for luxury editorial pacing
export const cinematicEase = [0.22, 1, 0.36, 1] as const;

// Slower, meditative glide for background images and atmospheric reveals
export const filmicEase = [0.16, 1, 0.3, 1] as const;

// Transition presets
export const transitions = {
  // Page / Scene transition
  scene: {
    duration: 0.45,
    ease: cinematicEase,
  } as Transition,

  // Photographic cross-dissolve
  photoDissolve: {
    duration: 0.4,
    ease: cinematicEase,
  } as Transition,

  // Typography stagger reveal
  textReveal: {
    duration: 0.7,
    ease: cinematicEase,
  } as Transition,

  // Subtle UI controls & buttons
  ui: {
    duration: 0.25,
    ease: cinematicEase,
  } as Transition,

  // Background slow camera drift
  cameraDrift: {
    duration: 2.2,
    ease: filmicEase,
  } as Transition,
};

// Scene-level variants for page navigation cuts
export const sceneVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: cinematicEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.28,
      ease: cinematicEase,
    },
  },
};

// Section entrance variants
export const sectionFadeVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: cinematicEase,
    },
  },
};

// Hairline divider drawing animation
export const hairlineVariants: Variants = {
  hidden: {
    scaleX: 0,
    transformOrigin: 'left',
  },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.85,
      ease: cinematicEase,
      delay: 0.2,
    },
  },
};

// Staggered gallery grid item variants
export const galleryItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: cinematicEase,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: cinematicEase,
    },
  },
};

/**
 * Hook to provide motion tokens and variants that respect prefers-reduced-motion.
 * When reduced motion is preferred, transitions collapse to 0 duration and displacement is eliminated.
 */
export function useCinematicMotion() {
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = Boolean(shouldReduceMotion);

  return {
    reduceMotion,
    cinematicEase: reduceMotion ? ([0, 0, 1, 1] as const) : cinematicEase,
    filmicEase: reduceMotion ? ([0, 0, 1, 1] as const) : filmicEase,
    transitions: {
      scene: reduceMotion ? ({ duration: 0 } as Transition) : transitions.scene,
      photoDissolve: reduceMotion ? ({ duration: 0 } as Transition) : transitions.photoDissolve,
      textReveal: reduceMotion ? ({ duration: 0 } as Transition) : transitions.textReveal,
      ui: reduceMotion ? ({ duration: 0 } as Transition) : transitions.ui,
      cameraDrift: reduceMotion ? ({ duration: 0 } as Transition) : transitions.cameraDrift,
    },
    sceneVariants: {
      initial: {
        opacity: 0,
        y: reduceMotion ? 0 : 12,
      },
      animate: {
        opacity: 1,
        y: 0,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.42, ease: cinematicEase },
      },
      exit: {
        opacity: 0,
        y: reduceMotion ? 0 : -8,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.28, ease: cinematicEase },
      },
    } as Variants,
    sectionFadeVariants: {
      hidden: {
        opacity: 0,
        y: reduceMotion ? 0 : 20,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.7, ease: cinematicEase },
      },
    } as Variants,
    hairlineVariants: {
      hidden: {
        scaleX: reduceMotion ? 1 : 0,
        transformOrigin: 'left',
      },
      visible: {
        scaleX: 1,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.85, ease: cinematicEase, delay: 0.2 },
      },
    } as Variants,
    galleryItemVariants: {
      hidden: {
        opacity: 0,
        y: reduceMotion ? 0 : 16,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.5, ease: cinematicEase },
      },
      exit: {
        opacity: 0,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.25, ease: cinematicEase },
      },
    } as Variants,
    fadeTransition: (duration: number = 0.7, delay: number = 0): Transition =>
      reduceMotion ? { duration: 0 } : { duration, delay, ease: cinematicEase },
    fadeUp: (yOffset: number = 20, duration: number = 0.7, delay: number = 0) => ({
      initial: { opacity: 0, y: reduceMotion ? 0 : yOffset },
      animate: { opacity: 1, y: 0 },
      transition: reduceMotion ? { duration: 0 } : { duration, delay, ease: cinematicEase },
    }),
    fadeUpInView: (yOffset: number = 20, duration: number = 0.7, delay: number = 0, margin: string = '-40px') => ({
      initial: { opacity: 0, y: reduceMotion ? 0 : yOffset },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin },
      transition: reduceMotion ? { duration: 0 } : { duration, delay, ease: cinematicEase },
    }),
  };
}
