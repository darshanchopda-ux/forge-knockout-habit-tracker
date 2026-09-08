import { useState } from "react";

export default function ReminderSettings({ settings, onChange }) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  );

  async function handleToggle(e) {
    const enabled = e.target.checked;
    if (enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
    onChange({ ...settings, enabled });
  }

  function handleTimeChange(e) {
    onChange({ ...settings, time: e.target.value });
  }

  return (
    <section className="reminder-settings">
      <label className="reminder-toggle">
        <input type="checkbox" checked={settings.enabled} onChange={handleToggle} />
        Remind me at
      </label>
      <input
        type="time"
        className="reminder-time"
        value={settings.time}
        disabled={!settings.enabled}
        onChange={handleTimeChange}
        aria-label="Reminder time"
      />
      {settings.enabled && permission === "denied" && (
        <p className="reminder-note">
          Notifications are blocked in your browser settings — you'll still see a reminder
          banner in the app.
        </p>
      )}
      {settings.enabled && permission === "unsupported" && (
        <p className="reminder-note">
          This browser doesn't support notifications — you'll still see a reminder banner in
          the app.
        </p>
      )}
      {settings.enabled && permission === "granted" && (
        <p className="reminder-note">
          Only fires while this app is open in a tab — a browser that's fully closed needs a
          server to wake it, which this app doesn't have.
        </p>
      )}
    </section>
  );
}
