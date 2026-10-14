import StudentForm from './StudentForm.jsx';

export default function AddStudent({ onCreate }) {
  return (
    <section className="panel" aria-labelledby="add-title">
      <h2 id="add-title" className="panel-title">
        Add a student
      </h2>
      <StudentForm
        idPrefix="add"
        submitLabel="Add student"
        savingLabel="Adding..."
        resetOnSuccess
        onSubmit={onCreate}
      />
    </section>
  );
}
