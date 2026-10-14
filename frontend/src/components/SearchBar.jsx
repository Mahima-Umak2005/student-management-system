export default function SearchBar({ value, onChange, resultCount, totalCount }) {
  const searching = value.trim() !== '';
  return (
    <div className="search">
      <label htmlFor="student-search" className="search-label">
        Search students
      </label>
      <div className="search-row">
        <input
          id="student-search"
          type="search"
          className="input"
          placeholder="Student ID, name, email or department"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
        {searching && (
          <button type="button" className="btn btn-ghost" onClick={() => onChange('')}>
            Clear
          </button>
        )}
      </div>
      <p className="search-hint" aria-live="polite">
        {searching
          ? `Showing ${resultCount} of ${totalCount} students`
          : `${totalCount} ${totalCount === 1 ? 'student' : 'students'} in the register`}
      </p>
    </div>
  );
}
