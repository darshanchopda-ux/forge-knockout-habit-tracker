import { bestDayOfWeek, mostConsistentHabit, todayCompletionRate } from "../lib/stats.js";

export default function StatsDashboard({ habits }) {
  const today = todayCompletionRate(habits);
  const bestDay = bestDayOfWeek(habits);
  const consistent = mostConsistentHabit(habits);

  return (
    <section className="stats-dashboard" aria-label="Your habit insights">
      <div className="stat-tile">
        <span className="stat-value">
          {today.done}/{today.total}
        </span>
        <span className="stat-label">done today</span>
      </div>
      {bestDay && (
        <div className="stat-tile">
          <span className="stat-value">{bestDay.day}</span>
          <span className="stat-label">your most consistent day</span>
        </div>
      )}
      {consistent && (
        <div className="stat-tile">
          <span className="stat-value">{Math.round(consistent.rate * 100)}%</span>
          <span className="stat-label">lifetime rate · {consistent.habit.name}</span>
        </div>
      )}
    </section>
  );
}
