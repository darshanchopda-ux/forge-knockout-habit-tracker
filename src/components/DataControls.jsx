import { useRef } from "react";
import { normaliseHabits } from "../lib/storage.js";

export default function DataControls({ habits, onImport }) {
  const fileInputRef = useRef(null);

  function handleExport() {
    const payload = { exportedAt: new Date().toISOString(), habits };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;

    let imported;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed?.habits;
      imported = normaliseHabits(list);
    } catch {
      window.alert("That file couldn't be read as a Habit Tracker export.");
      return;
    }

    if (imported.length === 0) {
      window.alert("That file doesn't contain any habits Habit Tracker recognises.");
      return;
    }

    const proceed = window.confirm(
      `Import ${imported.length} habit${imported.length === 1 ? "" : "s"}? This replaces everything currently in Habit Tracker on this device.`,
    );
    if (proceed) onImport(imported);
  }

  return (
    <section className="data-controls">
      <button type="button" onClick={handleExport}>
        Export data
      </button>
      <button type="button" onClick={handleImportClick}>
        Import data
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="sr-only"
        onChange={handleFileChange}
      />
    </section>
  );
}
