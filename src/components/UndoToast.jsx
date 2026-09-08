export default function UndoToast({ habitName, onUndo }) {
  return (
    <div className="undo-toast" role="status">
      <span>“{habitName}” deleted</span>
      <button type="button" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
