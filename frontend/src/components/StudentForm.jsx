import { useRef, useState } from 'react';
import { EMPTY_STUDENT, MAX_SEMESTER, MIN_SEMESTER, toPayload, validateStudent } from '../utils/validation.js';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Business Administration',
];

const SEMESTERS = Array.from({ length: MAX_SEMESTER - MIN_SEMESTER + 1 }, (_, i) => MIN_SEMESTER + i);

function Field({ id, label, required, error, hint, children }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ');
  return (
    <div className={error ? 'field field-invalid' : 'field'}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="req" aria-hidden="true"> *</span> : <span className="opt"> (optional)</span>}
      </label>
      {children({ 'aria-invalid': error ? 'true' : 'false', 'aria-describedby': describedBy || undefined })}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * One form used for both "Add" and "Edit".
 * onSubmit(payload) must return a promise; if it throws an ApiError the
 * message and field errors are shown here.
 */
export default function StudentForm({
  idPrefix,
  initialValues = EMPTY_STUDENT,
  submitLabel,
  savingLabel = 'Saving...',
  resetOnSuccess = false,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (formError) setFormError('');
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const focusFirstInvalid = () => {
    setTimeout(() => {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    }, 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const clientErrors = validateStudent(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstInvalid();
      return;
    }

    setSaving(true);
    try {
      await onSubmit(toPayload(values));
      if (resetOnSuccess) {
        setValues(EMPTY_STUDENT);
        setErrors({});
      }
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message || 'Could not save the student.');
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) focusFirstInvalid();
    } finally {
      setSaving(false);
    }
  };

  const id = (field) => `${idPrefix}-${field}`;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="form-error" role="alert">
          {formError}
        </div>
      )}

      <Field id={id('studentId')} label="Student ID" required error={errors.studentId} hint="Letters, numbers, - and _ only. Must be unique.">
        {(aria) => (
          <input
            id={id('studentId')}
            name="studentId"
            className="input"
            value={values.studentId}
            onChange={handleChange}
            maxLength={20}
            autoComplete="off"
            {...aria}
          />
        )}
      </Field>

      <Field id={id('name')} label="Full name" required error={errors.name}>
        {(aria) => (
          <input
            id={id('name')}
            name="name"
            className="input"
            value={values.name}
            onChange={handleChange}
            maxLength={100}
            autoComplete="off"
            {...aria}
          />
        )}
      </Field>

      <Field id={id('email')} label="Email" required error={errors.email}>
        {(aria) => (
          <input
            id={id('email')}
            name="email"
            type="email"
            className="input"
            value={values.email}
            onChange={handleChange}
            maxLength={254}
            autoComplete="off"
            {...aria}
          />
        )}
      </Field>

      <Field id={id('department')} label="Department" required error={errors.department}>
        {(aria) => (
          <>
            <input
              id={id('department')}
              name="department"
              className="input"
              list={id('department-list')}
              value={values.department}
              onChange={handleChange}
              maxLength={100}
              autoComplete="off"
              {...aria}
            />
            <datalist id={id('department-list')}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </>
        )}
      </Field>

      <div className="field-pair">
        <Field id={id('semester')} label="Semester" required error={errors.semester}>
          {(aria) => (
            <select
              id={id('semester')}
              name="semester"
              className="input"
              value={values.semester}
              onChange={handleChange}
              {...aria}
            >
              <option value="">Select</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id={id('contact')} label="Contact number" error={errors.contact}>
          {(aria) => (
            <input
              id={id('contact')}
              name="contact"
              type="tel"
              className="input"
              value={values.contact}
              onChange={handleChange}
              maxLength={15}
              autoComplete="off"
              {...aria}
            />
          )}
        </Field>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? (
            <>
              <span className="spinner spinner-sm" aria-hidden="true" /> {savingLabel}
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
