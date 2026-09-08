import { useState } from "react";

export default function ArchivedHabits({ habits, onRestore, onDeleteForever }) {
  const [open, setOpen] = useState(false);

  if (habits.length === 0) return null;

  return (
    <section className="archived-habits">
      <button
        type="button"
        className="archived-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "▾" : "▸"} Archived ({habits.length})
      </button>
      {open && (
        <ul className="archived-list">
          {habits.map((habit) => (
            <li key={habit.id} className="archived-row">
              <span className="habit-name">
                {habit.icon && <span aria-hidden="true">{habit.icon} </span>}
                {habit.name}
              </span>
              <button type="button" onClick={() => onRestore(habit.id)}>
                Restore
              </button>
              <button
                type="button"
                className="archived-delete-forever"
                onClick={() => {
                  if (window.confirm(`Permanently delete "${habit.name}" and all its history?`)) {
                    onDeleteForever(habit.id);
                  }
                }}
              >
                Delete forever
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
