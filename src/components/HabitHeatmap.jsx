import { useState } from "react";
import { buildHeatmap } from "../lib/heatmap.js";
import { todayISO } from "../lib/dates.js";
import { MAX_NOTE_LENGTH } from "../lib/storage.js";

export default function HabitHeatmap({ checkIns, habitName, notes, onSetNote }) {
  const today = todayISO();
  const { columns, start, end, doneCount, trackedDays } = buildHeatmap(checkIns);
  const notesByDate = notes && typeof notes === "object" ? notes : {};
  const [draftNote, setDraftNote] = useState(notesByDate[today] ?? "");

  function handleNoteBlur() {
    const trimmed = draftNote.trim();
    if (trimmed !== (notesByDate[today] ?? "")) onSetNote(today, trimmed);
  }

  return (
    <div
      className="habit-heatmap"
      role="img"
      aria-label={`${habitName} check-in history: ${doneCount} of ${trackedDays} days done, ${start} to ${end}`}
    >
      <div className="habit-heatmap-scroll">
        <div className="habit-heatmap-grid" aria-hidden="true">
          {columns.map((col, i) => (
            <div className="habit-heatmap-col" key={i} style={{ "--col": i }}>
              {col.map((cell) => {
                const note = notesByDate[cell.date];
                const title = cell.future
                  ? undefined
                  : cell.date + (cell.checked ? " — done" : "") + (note ? ` — “${note}”` : "");
                return (
                  <div
                    key={cell.date}
                    className={
                      cell.future
                        ? "habit-heatmap-cell habit-heatmap-cell-future"
                        : cell.checked
                          ? "habit-heatmap-cell habit-heatmap-cell-done"
                          : "habit-heatmap-cell"
                    }
                    title={title}
                    data-has-note={note ? "true" : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="habit-heatmap-caption">
        {doneCount} of {trackedDays} days · {start} – {end}
      </p>
      <label className="habit-note-field">
        <span>Note for today</span>
        <input
          type="text"
          value={draftNote}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Optional — e.g. felt great, or why you skipped"
          onChange={(e) => setDraftNote(e.target.value)}
          onBlur={handleNoteBlur}
        />
      </label>
    </div>
  );
}
