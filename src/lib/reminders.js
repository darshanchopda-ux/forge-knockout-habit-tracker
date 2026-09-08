const SETTINGS_KEY = "habit-tracker:reminder";
const LAST_NOTIFIED_KEY = "habit-tracker:reminder:lastNotifiedDate";
const TIME_RE = /^\d{2}:\d{2}$/;

const DEFAULT_SETTINGS = { enabled: false, time: "20:00" };

export function loadReminderSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normaliseSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveReminderSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable — the reminder toggle just won't persist this session
  }
}

export function normaliseSettings(value) {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : DEFAULT_SETTINGS.enabled,
    time: typeof value.time === "string" && TIME_RE.test(value.time) ? value.time : DEFAULT_SETTINGS.time,
  };
}

/**
 * Habits with no check-in for `today`, regardless of frequency. A reminder
 * is about "did you do anything today", not about whether a weekly habit
 * has hit its target for the week — that's what the streak badge is for.
 */
export function incompleteHabits(habits, today) {
  if (!Array.isArray(habits)) return [];
  return habits.filter((h) => {
    if (h.archived) return false;
    const checkIns = Array.isArray(h.checkIns) ? h.checkIns : [];
    return !checkIns.includes(today);
  });
}

/**
 * Has the wall clock reached `time` ("HH:MM") yet? Deliberately compares in
 * local time, unlike the calendar-date math in dates.js — a reminder is
 * about the hour on the user's own clock, not a UTC-anchored calendar day.
 */
export function isPastTime(time, now = new Date()) {
  const [hours, minutes] = time.split(":").map(Number);
  const target = hours * 60 + minutes;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= target;
}

/**
 * Habits that are overdue for a reminder right now: not archived, not
 * checked in today, and past whichever reminder time applies — the habit's
 * own `reminderTime` if it set one, otherwise the app-wide default. This is
 * what both the in-app banner and the OS notification check against.
 */
export function dueHabits(habits, globalSettings, today, now = new Date()) {
  if (!globalSettings.enabled || !Array.isArray(habits)) return [];
  return habits.filter((h) => {
    if (h.archived) return false;
    const checkIns = Array.isArray(h.checkIns) ? h.checkIns : [];
    if (checkIns.includes(today)) return false;
    const time = typeof h.reminderTime === "string" && TIME_RE.test(h.reminderTime)
      ? h.reminderTime
      : globalSettings.time;
    return isPastTime(time, now);
  });
}

export function getLastNotifiedDate() {
  try {
    return localStorage.getItem(LAST_NOTIFIED_KEY);
  } catch {
    return null;
  }
}

export function setLastNotifiedDate(date) {
  try {
    localStorage.setItem(LAST_NOTIFIED_KEY, date);
  } catch {
    // Best effort — worst case we notify more than once in a day, not zero times
  }
}
