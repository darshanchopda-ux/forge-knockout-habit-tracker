import { addDaysISO, startOfWeekISO, todayISO } from "./dates.js";

const DAILY = { type: "daily" };

/**
 * Bring a stored frequency up to a shape the rest of this module can trust:
 * { type: "daily" } or { type: "weekly", target: 1..7 }. Anything else —
 * missing, malformed, an out-of-range target — falls back to daily, since a
 * habit with a broken frequency should behave like the simplest case rather
 * than throw.
 */
export function normaliseFrequency(frequency) {
  if (frequency && frequency.type === "weekly") {
    const target = Math.floor(Number(frequency.target));
    if (Number.isInteger(target) && target >= 1 && target <= 7) {
      return { type: "weekly", target };
    }
  }
  return DAILY;
}

function periodKey(dateISO, frequency) {
  return frequency.type === "weekly" ? startOfWeekISO(dateISO) : dateISO;
}

function periodStep(frequency) {
  return frequency.type === "weekly" ? 7 : 1;
}

function periodTarget(frequency) {
  return frequency.type === "weekly" ? frequency.target : 1;
}

function toDaySet(checkIns) {
  if (!Array.isArray(checkIns)) return new Set();
  return new Set(
    checkIns.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)),
  );
}

function countByPeriod(checkIns, frequency) {
  const counts = new Map();
  for (const day of toDaySet(checkIns)) {
    const key = periodKey(day, frequency);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/**
 * How many check-ins have landed in the period containing `today` (a day
 * for a daily habit, the Mon-Sun week for a weekly one) against its target.
 * Returns null for daily habits — a single checkmark already says it all,
 * there is no count worth showing.
 */
export function currentPeriodProgress(checkIns, frequency = DAILY, today = todayISO()) {
  const freq = normaliseFrequency(frequency);
  if (freq.type !== "weekly") return null;
  const counts = countByPeriod(checkIns, freq);
  const key = periodKey(today, freq);
  return { count: counts.get(key) || 0, target: freq.target };
}

/**
 * Number of consecutive qualifying periods ending with the one containing
 * `today`.
 *
 * The still-in-progress current period never breaks the streak, whether or
 * not it has hit target yet — for a daily habit that means "today" isn't
 * counted against you until the day is actually over, and the same rule
 * carries over to weekly habits: an incomplete current week is not yet a
 * broken week. That keeps the two frequencies feeling consistent instead of
 * weekly habits having a harsher rule than daily ones.
 */
export function currentStreak(checkIns, frequency = DAILY, today = todayISO()) {
  const freq = normaliseFrequency(frequency);
  const counts = countByPeriod(checkIns, freq);
  if (counts.size === 0) return 0;

  const target = periodTarget(freq);
  const step = periodStep(freq);
  let cursor = periodKey(today, freq);

  if ((counts.get(cursor) || 0) < target) {
    cursor = addDaysISO(cursor, -step);
  }

  let streak = 0;
  while ((counts.get(cursor) || 0) >= target) {
    streak += 1;
    cursor = addDaysISO(cursor, -step);
  }

  return streak;
}

/**
 * The longest run of consecutive qualifying periods anywhere in the
 * history — used to tell someone their current streak is (or isn't) a
 * personal best.
 */
export function longestStreak(checkIns, frequency = DAILY) {
  const freq = normaliseFrequency(frequency);
  const counts = countByPeriod(checkIns, freq);
  if (counts.size === 0) return 0;

  const target = periodTarget(freq);
  const step = periodStep(freq);
  let best = 0;

  for (const key of counts.keys()) {
    // Only start counting from the first period of a run, so each run is
    // walked once and the whole thing stays linear.
    if ((counts.get(addDaysISO(key, -step)) || 0) >= target) continue;

    let length = 0;
    let cursor = key;
    while ((counts.get(cursor) || 0) >= target) {
      length += 1;
      cursor = addDaysISO(cursor, step);
    }
    if (length > best) best = length;
  }

  return best;
}
