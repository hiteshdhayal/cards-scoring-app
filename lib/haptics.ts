export function vibrate(pattern: number | number[] = 10) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Safari/iOS doesn't support the Vibration API — ignore.
  }
}
