export function todayISO() {
  const now = new Date();
  return isoFromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// All date arithmetic below runs in UTC on purpose: these are calendar
// dates, not instants, and stepping through them in local time makes a day
// go missing (or repeat) across a daylight-saving boundary.

export function addDaysISO(iso, delta) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return isoFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

// Monday of the week containing `iso`.
export function startOfWeekISO(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const toMonday = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + toMonday);
  return isoFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

// Monday = 0 .. Sunday = 6, matching this app's Monday-first week convention
// (startOfWeekISO above) rather than JS's native Sunday-first getDay().
export function weekdayIndexISO(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 Sun .. 6 Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Whole calendar days from `a` to `b` (positive when b is later).
export function daysBetweenISO(a, b) {
  const toUTC = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(b) - toUTC(a)) / 86400000);
}

function isoFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
