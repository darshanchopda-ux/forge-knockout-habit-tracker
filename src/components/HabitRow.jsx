import { useEffect, useRef, useState } from "react";
import { todayISO } from "../lib/dates.js";
import { currentPeriodProgress, currentStreak, normaliseFrequency } from "../lib/streak.js";
import { MAX_HABIT_NAME_LENGTH } from "../lib/storage.js";
import { HABIT_ICONS } from "../lib/icons.js";
import HabitHeatmap from "./HabitHeatmap.jsx";

const EXIT_ANIMATION_MS = 220;

export default function HabitRow({
  habit,
  index,
  reorderMode,
  isFirst,
  isLast,
  globalReminderTime,
  onToggleToday,
  onEditHabit,
  onArchive,
  onDelete,
  onSetNote,
  onMoveUp,
  onMoveDown,
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(habit.name);
  const [draftIcon, setDraftIcon] = useState(habit.icon);
  const [draftReminderOn, setDraftReminderOn] = useState(!!habit.reminderTime);
  const [draftReminderTime, setDraftReminderTime] = useState(habit.reminderTime ?? globalReminderTime);
  const [leaving, setLeaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const today = todayISO();
  // Guard the shape rather than trusting the caller: storage.js normalises
  // on load, but defending here too means this component never crashes the
  // whole app no matter what feeds it.
  const checkIns = Array.isArray(habit.checkIns) ? habit.checkIns : [];
  const frequency = normaliseFrequency(habit.frequency);
  const done = checkIns.includes(today);
  const streak = currentStreak(checkIns, frequency, today);
  const progress = currentPeriodProgress(checkIns, frequency, today);

  const streakUnit = frequency.type === "weekly" ? "week" : "day";
  const streakLabel = streak === 1 ? `1 ${streakUnit} streak` : `${streak} ${streakUnit} streak`;

  function startEditing() {
    setDraftName(habit.name);
    setDraftIcon(habit.icon);
    setDraftReminderOn(!!habit.reminderTime);
    setDraftReminderTime(habit.reminderTime ?? globalReminderTime);
    setEditing(true);
  }

  function commitEdit() {
    const trimmed = draftName.trim();
    onEditHabit(habit.id, {
      name: trimmed || habit.name,
      icon: draftIcon,
      reminderTime: draftReminderOn ? draftReminderTime : null,
    });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleNameKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  }

  function playExit(after) {
    setLeaving(true);
    setTimeout(after, EXIT_ANIMATION_MS);
  }

  if (reorderMode) {
    return (
      <li className="habit-row habit-row-reorder">
        <div className="habit-row-main">
          <span className="habit-reorder-icon" aria-hidden="true">
            {habit.icon ?? "•"}
          </span>
          <span className="habit-name">{habit.name}</span>
          <button
            type="button"
            className="habit-move-button"
            disabled={isFirst}
            aria-label={`Move ${habit.name} up`}
            onClick={() => onMoveUp(habit.id)}
          >
            ↑
          </button>
          <button
            type="button"
            className="habit-move-button"
            disabled={isLast}
            aria-label={`Move ${habit.name} down`}
            onClick={() => onMoveDown(habit.id)}
          >
            ↓
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={leaving ? "habit-row is-leaving" : "habit-row"}
      style={{ "--stagger": index ?? 0 }}
    >
      <div className="habit-row-main">
        <button
          type="button"
          className="habit-check"
          aria-pressed={done}
          onClick={() => onToggleToday(habit.id)}
        >
          <span className={done ? "habit-check-icon is-done" : "habit-check-icon"} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle className="habit-check-circle" cx="12" cy="12" r="10" />
              <path className="habit-check-mark" d="M7 12.5l3 3 7-7" />
            </svg>
          </span>
          {habit.icon && (
            <span className="habit-icon" aria-hidden="true">
              {habit.icon}
            </span>
          )}
          <span className={done ? "habit-name habit-name-done" : "habit-name"}>
            {habit.name}
          </span>
          {progress && (
            <span className="habit-frequency-badge">
              {progress.count}/{progress.target} this week
            </span>
          )}
          {streak > 0 && (
            <span className="habit-streak">
              <span aria-hidden="true">🔥</span>
              <span aria-hidden="true" className="habit-streak-count">
                {streak}
              </span>
              <span className="sr-only">{streakLabel}</span>
            </span>
          )}
        </button>
        <button
          type="button"
          className="habit-edit-toggle"
          aria-label={`Edit ${habit.name}`}
          onClick={startEditing}
        >
          <span aria-hidden="true">✎</span>
        </button>
        <button
          type="button"
          className="habit-archive-toggle"
          aria-label={`Archive ${habit.name}`}
          onClick={() => playExit(() => onArchive(habit.id))}
        >
          <span aria-hidden="true">📦</span>
        </button>
        <button
          type="button"
          className="habit-history-toggle"
          aria-expanded={showHistory}
          aria-label={`${showHistory ? "Hide" : "Show"} check-in history for ${habit.name}`}
          onClick={() => setShowHistory((v) => !v)}
        >
          <span aria-hidden="true">📅</span>
        </button>
        <button
          type="button"
          className="habit-delete"
          aria-label={`Delete ${habit.name}`}
          onClick={() => playExit(() => onDelete(habit.id))}
        >
          ×
        </button>
      </div>

      {editing && (
        <div className="habit-edit-panel">
          <input
            ref={inputRef}
            type="text"
            className="habit-name-input"
            value={draftName}
            maxLength={MAX_HABIT_NAME_LENGTH}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleNameKeyDown}
            aria-label={`Rename ${habit.name}`}
          />

          <div className="icon-picker" role="group" aria-label="Choose an icon">
            <button
              type="button"
              className={draftIcon === null ? "icon-swatch is-selected" : "icon-swatch"}
              aria-pressed={draftIcon === null}
              aria-label="No icon"
              onClick={() => setDraftIcon(null)}
            >
              ⊘
            </button>
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={draftIcon === icon ? "icon-swatch is-selected" : "icon-swatch"}
                aria-pressed={draftIcon === icon}
                aria-label={`Icon ${icon}`}
                onClick={() => setDraftIcon(icon)}
              >
                {icon}
              </button>
            ))}
          </div>

          <label className="edit-panel-row">
            <input
              type="checkbox"
              checked={draftReminderOn}
              onChange={(e) => setDraftReminderOn(e.target.checked)}
            />
            Custom reminder time for this habit
          </label>
          <input
            type="time"
            className="reminder-time"
            disabled={!draftReminderOn}
            value={draftReminderTime}
            onChange={(e) => setDraftReminderTime(e.target.value)}
            aria-label="Custom reminder time"
          />

          <div className="edit-panel-actions">
            <button type="button" className="edit-panel-save" onClick={commitEdit}>
              Save
            </button>
            <button type="button" className="edit-panel-cancel" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <HabitHeatmap
          checkIns={checkIns}
          habitName={habit.name}
          notes={habit.notes}
          onSetNote={(date, text) => onSetNote(habit.id, date, text)}
        />
      )}
    </li>
  );
}
