import Modal from './Modal.jsx';
import StudentForm from './StudentForm.jsx';
import { fromStudent } from '../utils/validation.js';

export default function EditStudent({ student, onSave, onCancel }) {
  return (
    <Modal titleId="edit-title" onClose={onCancel}>
      <h2 id="edit-title" className="dialog-title">
        Edit student
      </h2>
      <StudentForm
        idPrefix="edit"
        initialValues={fromStudent(student)}
        submitLabel="Save changes"
        savingLabel="Saving..."
        onSubmit={(payload) => onSave(student._id, payload)}
        onCancel={onCancel}
      />
    </Modal>
  );
}
