import Modal from './Modal.jsx';

export default function ConfirmDialog({ student, busy, onCancel, onConfirm }) {
  return (
    <Modal titleId="confirm-title" onClose={onCancel} dismissible={!busy}>
      <h2 id="confirm-title" className="dialog-title">
        Delete this student?
      </h2>
      <p className="dialog-text">
        <strong>{student.name}</strong> ({student.studentId}) will be permanently removed from the
        database. This cannot be undone.
      </p>
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? (
            <>
              <span className="spinner spinner-sm" aria-hidden="true" /> Deleting...
            </>
          ) : (
            'Delete student'
          )}
        </button>
      </div>
    </Modal>
  );
}
