import { daysBetweenISO, todayISO, weekdayIndexISO } from "./dates.js";

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function activeHabits(habits) {
  return Array.isArray(habits) ? habits.filter((h) => !h.archived) : [];
}

/**
 * How many of today's active habits are checked in, out of how many there
 * are. Archived habits don't count either way — they're not being tracked.
 */
export function todayCompletionRate(habits, today = todayISO()) {
  const active = activeHabits(habits);
  const done = active.filter((h) => {
    const checkIns = Array.isArray(h.checkIns) ? h.checkIns : [];
    return checkIns.includes(today);
  }).length;
  return { done, total: active.length };
}

/**
 * Which day of the week has the most check-ins across all history and all
 * active habits — "you're most consistent on Mondays". Ties break toward
 * whichever day comes first Monday-to-Sunday, so the result is deterministic.
 * Returns null when there is no check-in history at all.
 */
export function bestDayOfWeek(habits) {
  const counts = new Array(7).fill(0);
  let any = false;

  for (const habit of activeHabits(habits)) {
    const checkIns = Array.isArray(habit.checkIns) ? habit.checkIns : [];
    for (const date of checkIns) {
      counts[weekdayIndexISO(date)] += 1;
      any = true;
    }
  }

  if (!any) return null;

  let bestIndex = 0;
  for (let i = 1; i < 7; i++) {
    if (counts[i] > counts[bestIndex]) bestIndex = i;
  }
  return { day: WEEKDAY_NAMES[bestIndex], count: counts[bestIndex] };
}

/**
 * The habit with the highest lifetime completion rate: check-ins made out
 * of days available since it was created. This is a simple, frequency-
 * agnostic reliability measure — it does not know about weekly targets,
 * that nuance belongs to the streak badge instead. Returns null when there
 * are no active habits.
 */
export function mostConsistentHabit(habits, today = todayISO()) {
  const active = activeHabits(habits);
  if (active.length === 0) return null;

  let best = null;
  for (const habit of active) {
    const checkIns = Array.isArray(habit.checkIns) ? habit.checkIns : [];
    const daysTracked = Math.max(1, daysBetweenISO(habit.createdAt, today) + 1);
    const rate = checkIns.length / daysTracked;
    if (!best || rate > best.rate) best = { habit, rate };
  }
  return best;
}
