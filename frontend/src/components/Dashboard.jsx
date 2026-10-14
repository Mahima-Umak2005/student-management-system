export default function Dashboard({ students, loading }) {
  const total = students.length;
  const departments = new Set(students.map((s) => s.department.trim().toLowerCase())).size;
  const latest = students[0]; // the API returns newest first

  return (
    <section className="dashboard" aria-label="Summary">
      <div className="dash-main">
        <span className="dash-number" aria-live="polite" data-testid="total-students">
          {loading && total === 0 ? '-' : total}
        </span>
        <span className="dash-caption">registered {total === 1 ? 'student' : 'students'}</span>
      </div>
      <dl className="dash-stats">
        <div>
          <dt>Departments</dt>
          <dd>{departments}</dd>
        </div>
        <div>
          <dt>Latest addition</dt>
          <dd>{latest ? latest.name : 'None yet'}</dd>
        </div>
      </dl>
    </section>
  );
}
