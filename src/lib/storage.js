import { todayISO } from "./dates.js";
import { normaliseFrequency } from "./streak.js";

const STORAGE_KEY = "habit-tracker:habits";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export const MAX_HABIT_NAME_LENGTH = 80;
export const MAX_NOTE_LENGTH = 200;

export function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normaliseHabits(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveHabits(habits) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {
    // localStorage unavailable (e.g. private browsing) — app still works for this session
  }
}

/**
 * Bring a raw list (from localStorage, or an imported export file) up to
 * habits this app can trust. Used both on normal load and when importing a
 * file from another device — the two are the same trust boundary.
 */
export function normaliseHabits(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normaliseHabit).filter(Boolean);
}

/**
 * Bring one stored habit up to the current shape, or drop it if it is too
 * broken to show.
 *
 * JSON.parse succeeding only means the text was valid JSON, never that the
 * contents are what we expect. A habit written by an older build is missing
 * whatever field this build added most recently, and reading any of them
 * blindly throws during render — which takes down the whole app, not just
 * the offending row. Repairing on the way in keeps every consumer free to
 * assume the shape is sound.
 */
function normaliseHabit(habit) {
  if (!habit || typeof habit !== "object") return null;
  if (typeof habit.name !== "string" || !habit.name.trim()) return null;

  return {
    id: typeof habit.id === "string" && habit.id ? habit.id : crypto.randomUUID(),
    name: habit.name.trim().slice(0, MAX_HABIT_NAME_LENGTH),
    createdAt:
      typeof habit.createdAt === "string" && ISO_DATE.test(habit.createdAt)
        ? habit.createdAt
        : todayISO(),
    checkIns: Array.isArray(habit.checkIns)
      ? [...new Set(habit.checkIns.filter(isISODate))].sort()
      : [],
    frequency: normaliseFrequency(habit.frequency),
    archived: habit.archived === true,
    icon: typeof habit.icon === "string" && habit.icon ? habit.icon.slice(0, 4) : null,
    reminderTime: typeof habit.reminderTime === "string" && TIME_RE.test(habit.reminderTime)
      ? habit.reminderTime
      : null,
    notes: normaliseNotes(habit.notes),
  };
}

function normaliseNotes(notes) {
  if (!notes || typeof notes !== "object") return {};
  const clean = {};
  for (const [date, text] of Object.entries(notes)) {
    if (!isISODate(date) || typeof text !== "string" || !text.trim()) continue;
    clean[date] = text.trim().slice(0, MAX_NOTE_LENGTH);
  }
  return clean;
}

function isISODate(value) {
  return typeof value === "string" && ISO_DATE.test(value);
}
