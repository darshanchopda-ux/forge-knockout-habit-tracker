const PREF_KEY = "habit-tracker:soundEnabled";

export function loadSoundEnabled() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export function saveSoundEnabled(enabled) {
  try {
    localStorage.setItem(PREF_KEY, String(enabled));
  } catch {
    // Best effort — the toggle just won't persist this session
  }
}

let sharedContext = null;

/**
 * A short synthesized "pop" on check-in — no audio file to ship, and it
 * degrades silently (no sound, no error) anywhere Web Audio is unavailable
 * or the browser hasn't yet unlocked audio for this page.
 */
export function playCheckSound() {
  try {
    if (typeof AudioContext === "undefined" && typeof webkitAudioContext === "undefined") return;
    const Ctx = typeof AudioContext !== "undefined" ? AudioContext : webkitAudioContext;
    sharedContext ??= new Ctx();
    const ctx = sharedContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // Never let a sound glitch break the actual check-in
  }
}
