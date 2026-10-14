import { useEffect, useRef } from 'react';

// Wraps the browser's built-in <dialog>. It traps keyboard focus, closes on
// Escape and dims the page behind it - all accessible by default.
export default function Modal({ titleId, onClose, dismissible = true, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog && dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        // A click on the dimmed backdrop targets the dialog element itself.
        if (dismissible && event.target === ref.current) onClose();
      }}
    >
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
