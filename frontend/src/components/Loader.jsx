export default function Loader({ label = 'Loading...', block = false }) {
  return (
    <div className={block ? 'loader loader-block' : 'loader'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
