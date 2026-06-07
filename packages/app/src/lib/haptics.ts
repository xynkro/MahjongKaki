// Light haptic feedback (progressive enhancement).
// Android Chrome supports navigator.vibrate; iOS Safari does not — it no-ops there.
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
  tap: () => buzz(8),
  select: () => buzz(12),
  success: () => buzz([20, 40, 28]),
  flower: () => buzz([10, 28, 10]),
  error: () => buzz([28, 30, 28]),
};
