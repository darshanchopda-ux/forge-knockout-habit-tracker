export default function ReminderBanner({ count }) {
  const text = count === 1 ? "1 habit still to do today" : `${count} habits still to do today`;

  return (
    <p className="reminder-banner" role="status">
      <span aria-hidden="true">🔔</span> {text}
    </p>
  );
}
