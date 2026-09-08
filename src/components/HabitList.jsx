import HabitRow from "./HabitRow.jsx";

export default function HabitList({
  habits,
  reorderMode,
  globalReminderTime,
  onToggleToday,
  onEditHabit,
  onArchive,
  onDelete,
  onSetNote,
  onMoveUp,
  onMoveDown,
  emptyMessage,
}) {
  if (habits.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <ul className="habit-list">
      {habits.map((habit, index) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          index={index}
          reorderMode={reorderMode}
          isFirst={index === 0}
          isLast={index === habits.length - 1}
          globalReminderTime={globalReminderTime}
          onToggleToday={onToggleToday}
          onEditHabit={onEditHabit}
          onArchive={onArchive}
          onDelete={onDelete}
          onSetNote={onSetNote}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      ))}
    </ul>
  );
}
