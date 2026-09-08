import { useState } from "react";
import { MAX_HABIT_NAME_LENGTH } from "../lib/storage.js";

const MIN_TIMES_PER_WEEK = 1;
const MAX_TIMES_PER_WEEK = 7;

export default function AddHabitForm({ onAddHabit }) {
  const [name, setName] = useState("");
  const [freqType, setFreqType] = useState("daily");
  const [timesPerWeek, setTimesPerWeek] = useState(3);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const frequency =
      freqType === "weekly"
        ? { type: "weekly", target: clampTimes(timesPerWeek) }
        : { type: "daily" };
    onAddHabit(trimmed, frequency);
    setName("");
    setFreqType("daily");
    setTimesPerWeek(3);
  }

  return (
    <form className="add-habit-form" onSubmit={handleSubmit}>
      <label htmlFor="habit-name">Add a habit</label>
      <div className="add-habit-row">
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_HABIT_NAME_LENGTH}
          placeholder="e.g. Drink a glass of water"
          autoComplete="off"
        />
        <button type="submit">Add</button>
      </div>

      <fieldset className="frequency-fieldset">
        <legend>How often?</legend>
        <label className="frequency-option">
          <input
            type="radio"
            name="frequency"
            checked={freqType === "daily"}
            onChange={() => setFreqType("daily")}
          />
          Every day
        </label>
        <label className="frequency-option">
          <input
            type="radio"
            name="frequency"
            checked={freqType === "weekly"}
            onChange={() => setFreqType("weekly")}
          />
          <input
            type="number"
            className="frequency-weekly-count"
            min={MIN_TIMES_PER_WEEK}
            max={MAX_TIMES_PER_WEEK}
            value={timesPerWeek}
            aria-label="Times per week"
            onFocus={() => setFreqType("weekly")}
            onChange={(e) => setTimesPerWeek(e.target.value)}
          />
          times a week
        </label>
      </fieldset>
    </form>
  );
}

function clampTimes(n) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return 3;
  return Math.min(MAX_TIMES_PER_WEEK, Math.max(MIN_TIMES_PER_WEEK, v));
}
