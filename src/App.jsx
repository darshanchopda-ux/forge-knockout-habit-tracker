import { useEffect, useRef, useState } from "react";
import AddHabitForm from "./components/AddHabitForm.jsx";
import HabitTemplates from "./components/HabitTemplates.jsx";
import StatsDashboard from "./components/StatsDashboard.jsx";
import HabitList from "./components/HabitList.jsx";
import ArchivedHabits from "./components/ArchivedHabits.jsx";
import ReminderSettings from "./components/ReminderSettings.jsx";
import ReminderBanner from "./components/ReminderBanner.jsx";
import DataControls from "./components/DataControls.jsx";
import UndoToast from "./components/UndoToast.jsx";
import { loadHabits, saveHabits } from "./lib/storage.js";
import { todayISO } from "./lib/dates.js";
import {
  dueHabits,
  getLastNotifiedDate,
  loadReminderSettings,
  saveReminderSettings,
  setLastNotifiedDate,
} from "./lib/reminders.js";
import { loadSoundEnabled, playCheckSound, saveSoundEnabled } from "./lib/sound.js";

const CHECK_INTERVAL_MS = 30000;
const UNDO_WINDOW_MS = 6000;
const SEARCH_THRESHOLD = 6;

export default function App() {
  const [habits, setHabits] = useState(() => loadHabits());
  const [reminderSettings, setReminderSettings] = useState(() => loadReminderSettings());
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled());
  const [reorderMode, setReorderMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const undoTimeoutRef = useRef(null);

  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveReminderSettings(reminderSettings);
  }, [reminderSettings]);

  useEffect(() => {
    saveSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => () => clearTimeout(undoTimeoutRef.current), []);

  // Registering a service worker needs no permission and enables nothing on
  // its own — it just gives showNotification() somewhere to run, which is
  // the path mobile browsers require. Safe and cheap to do unconditionally.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Not fatal — OS notifications degrade to the in-app banner below,
        // which needs no service worker at all.
      });
    }
  }, []);

  // Best-effort local reminder: this only runs while the app is open in a
  // tab. Surviving the browser being fully closed needs a server holding a
  // Web Push subscription to wake the device — there is no backend here, so
  // that ceiling is real, not a bug to fix later.
  useEffect(() => {
    function check() {
      const today = todayISO();
      const due = dueHabits(habits, reminderSettings, today);
      if (due.length === 0) return;
      if (getLastNotifiedDate() === today) return;

      setLastNotifiedDate(today);
      notifyIfPossible(due.length);
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [habits, reminderSettings]);

  function handleAddHabit(name, frequency, icon = null) {
    const newHabit = {
      id: crypto.randomUUID(),
      name,
      createdAt: todayISO(),
      checkIns: [],
      frequency: frequency ?? { type: "daily" },
      archived: false,
      icon,
      reminderTime: null,
      notes: {},
    };
    setHabits((prev) => [...prev, newHabit]);
  }

  function handleToggleToday(habitId) {
    const today = todayISO();
    let becameDone = false;
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const checkIns = Array.isArray(habit.checkIns) ? habit.checkIns : [];
        const isDone = checkIns.includes(today);
        becameDone = !isDone;
        return {
          ...habit,
          checkIns: isDone
            ? checkIns.filter((d) => d !== today)
            : [...checkIns, today],
        };
      }),
    );
    if (becameDone && soundEnabled) playCheckSound();
  }

  function handleEditHabit(habitId, { name, icon, reminderTime }) {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, name, icon, reminderTime } : habit,
      ),
    );
  }

  function handleArchive(habitId) {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === habitId ? { ...habit, archived: true } : habit)),
    );
  }

  function handleRestore(habitId) {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === habitId ? { ...habit, archived: false } : habit)),
    );
  }

  function handleDeleteForever(habitId) {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
  }

  function handleDeleteRequest(habitId) {
    const index = habits.findIndex((h) => h.id === habitId);
    if (index === -1) return;

    clearTimeout(undoTimeoutRef.current);
    setPendingDelete({ habit: habits[index], index });
    undoTimeoutRef.current = setTimeout(() => setPendingDelete(null), UNDO_WINDOW_MS);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  }

  function handleUndoDelete() {
    if (!pendingDelete) return;
    clearTimeout(undoTimeoutRef.current);
    setHabits((prev) => {
      const next = [...prev];
      next.splice(Math.min(pendingDelete.index, next.length), 0, pendingDelete.habit);
      return next;
    });
    setPendingDelete(null);
  }

  function handleSetNote(habitId, date, text) {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const notes = { ...(habit.notes ?? {}) };
        if (text) notes[date] = text;
        else delete notes[date];
        return { ...habit, notes };
      }),
    );
  }

  function moveActiveHabit(habitId, direction) {
    setHabits((prev) => {
      const activeIndices = prev.map((h, i) => (!h.archived ? i : -1)).filter((i) => i !== -1);
      const posInActive = activeIndices.findIndex((i) => prev[i].id === habitId);
      const swapWith = posInActive + direction;
      if (posInActive === -1 || swapWith < 0 || swapWith >= activeIndices.length) return prev;

      const a = activeIndices[posInActive];
      const b = activeIndices[swapWith];
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function handleImport(importedHabits) {
    setHabits(importedHabits);
  }

  function handleToggleReorderMode() {
    setSearchText("");
    setReorderMode((v) => !v);
  }

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);
  const visibleHabits = reorderMode
    ? activeHabits
    : activeHabits.filter((h) =>
        h.name.toLowerCase().includes(searchText.trim().toLowerCase()),
      );

  const today = todayISO();
  const dueCount = dueHabits(habits, reminderSettings, today).length;

  return (
    <main className="app">
      <h1>Today</h1>
      <AddHabitForm onAddHabit={handleAddHabit} />
      {activeHabits.length === 0 && <HabitTemplates onAdd={handleAddHabit} />}
      <ReminderSettings settings={reminderSettings} onChange={setReminderSettings} />
      <label className="sound-toggle">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
        />
        Sound on check-off
      </label>

      {activeHabits.length > 0 && <StatsDashboard habits={habits} />}
      {dueCount > 0 && <ReminderBanner count={dueCount} />}

      {activeHabits.length > 1 && (
        <div className="list-toolbar">
          {!reorderMode && activeHabits.length > SEARCH_THRESHOLD && (
            <input
              type="search"
              className="habit-search"
              placeholder="Search habits…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Search habits"
            />
          )}
          <button type="button" className="reorder-toggle" onClick={handleToggleReorderMode}>
            {reorderMode ? "Done reordering" : "⇅ Reorder"}
          </button>
        </div>
      )}

      <HabitList
        habits={visibleHabits}
        reorderMode={reorderMode}
        globalReminderTime={reminderSettings.time}
        onToggleToday={handleToggleToday}
        onEditHabit={handleEditHabit}
        onArchive={handleArchive}
        onDelete={handleDeleteRequest}
        onSetNote={handleSetNote}
        onMoveUp={(id) => moveActiveHabit(id, -1)}
        onMoveDown={(id) => moveActiveHabit(id, 1)}
        emptyMessage={
          activeHabits.length === 0 ? "🌱 Add a habit to get started" : "No habits match your search"
        }
      />

      <ArchivedHabits
        habits={archivedHabits}
        onRestore={handleRestore}
        onDeleteForever={handleDeleteForever}
      />

      <DataControls habits={habits} onImport={handleImport} />

      {pendingDelete && (
        <UndoToast habitName={pendingDelete.habit.name} onUndo={handleUndoDelete} />
      )}
    </main>
  );
}

function notifyIfPossible(count) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const body = count === 1 ? "1 habit still to do today" : `${count} habits still to do today`;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.showNotification("Habit Tracker", { body, tag: "habit-reminder" });
      } else {
        new Notification("Habit Tracker", { body });
      }
    });
  } else {
    new Notification("Habit Tracker", { body });
  }
}
