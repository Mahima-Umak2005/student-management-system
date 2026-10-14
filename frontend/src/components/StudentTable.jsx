import Loader from './Loader.jsx';

export default function StudentTable({ students, totalCount, searchText, loading, error, onRetry, onEdit, onDelete }) {
  if (loading) {
    return <Loader block label="Loading students..." />;
  }

  if (error) {
    return (
      <div className="state state-error" role="alert">
        <h3>Could not load students</h3>
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="state">
        <h3>No students registered yet</h3>
        <p>Use the form to add the first student. They will be saved in MongoDB Atlas.</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="state">
        <h3>No matches</h3>
        <p>No student matches &ldquo;{searchText.trim()}&rdquo;. Try a different ID, name, email or department.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">Registered students</caption>
        <thead>
          <tr>
            <th scope="col">Student ID</th>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Department</th>
            <th scope="col" className="num">
              Sem
            </th>
            <th scope="col">Contact</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td data-label="Student ID" className="mono">
                {student.studentId}
              </td>
              <td data-label="Name" className="strong">
                {student.name}
              </td>
              <td data-label="Email" className="break">
                {student.email}
              </td>
              <td data-label="Department">{student.department}</td>
              <td data-label="Semester" className="num">
                {student.semester}
              </td>
              <td data-label="Contact">{student.contact || '-'}</td>
              <td className="actions">
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={() => onEdit(student)}
                  aria-label={`Edit ${student.name}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-danger-ghost"
                  onClick={() => onDelete(student)}
                  aria-label={`Delete ${student.name}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
