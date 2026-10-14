import { useEffect } from 'react';

// Shows one success or error message. Success messages hide themselves;
// error messages stay until the user closes them.
export default function Notification({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice || notice.type !== 'success') return undefined;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;

  return (
    <div className="toast-region">
      <div
        className={`toast toast-${notice.type}`}
        role={notice.type === 'error' ? 'alert' : 'status'}
      >
        <p>{notice.message}</p>
        <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss message">
          &times;
        </button>
      </div>
    </div>
  );
}
