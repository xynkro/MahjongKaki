// Feedback = haptics (Android vibrate) + sound (Web Audio, all platforms).
// iOS Safari ignores navigator.vibrate but plays the synthesized sound, so every
// existing haptics.* call site now also produces audio.
import { sound } from './sound';

function buzz(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore — vibration is non-essential */
    }
  }
}

export const haptics = {
  tap: () => { buzz(8); sound.tap(); },
  select: () => { buzz(12); sound.select(); },
  success: () => { buzz([20, 40, 28]); sound.success(); },
  flower: () => { buzz([10, 28, 10]); sound.flower(); },
  error: () => { buzz([28, 30, 28]); sound.error(); },
};

// Re-export so a future settings toggle can mute audio.
export { sound };
