import { HABIT_TEMPLATES } from "../lib/icons.js";

export default function HabitTemplates({ onAdd }) {
  return (
    <div className="habit-templates" aria-label="Quick-add a common habit">
      {HABIT_TEMPLATES.map((template) => (
        <button
          key={template.name}
          type="button"
          className="habit-template-chip"
          onClick={() => onAdd(template.name, { type: "daily" }, template.icon)}
        >
          <span aria-hidden="true">{template.icon}</span> {template.name}
        </button>
      ))}
    </div>
  );
}
