import { addDaysISO, startOfWeekISO, todayISO } from "./dates.js";

export const HEATMAP_WEEKS = 14;

/**
 * A Monday-start grid covering the last `weeks` weeks, oldest first, each
 * week seven { date, checked, future } cells. A cell after today is marked
 * `future` rather than unchecked — that day hasn't happened yet, so it is
 * not a missed check-in and should not render as one.
 */
export function buildHeatmap(checkIns, { weeks = HEATMAP_WEEKS, today = todayISO() } = {}) {
  const done = new Set(Array.isArray(checkIns) ? checkIns : []);
  const start = addDaysISO(startOfWeekISO(today), -7 * (weeks - 1));

  const columns = [];
  let cursor = start;
  let doneCount = 0;
  let trackedDays = 0;

  for (let w = 0; w < weeks; w++) {
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const future = cursor > today;
      const checked = !future && done.has(cursor);
      if (!future) {
        trackedDays += 1;
        if (checked) doneCount += 1;
      }
      cells.push({ date: cursor, checked, future });
      cursor = addDaysISO(cursor, 1);
    }
    columns.push(cells);
  }

  return { columns, start, end: today, doneCount, trackedDays };
}
