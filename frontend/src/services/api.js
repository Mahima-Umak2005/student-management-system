// The ONLY place in the frontend that talks to the backend.
// The API is served from the same site (Netlify Functions at /api/*),
// so requests use relative URLs and need no configuration.

const API_BASE_URL = '';

const REQUEST_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', {
        isNetworkError: true,
      });
    }
    throw new ApiError(
      'Cannot reach the server. Check your internet connection and try again.',
      { isNetworkError: true }
    );
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && payload.success === false)) {
    throw new ApiError(payload?.message || `Request failed with status ${response.status}.`, {
      status: response.status,
      fieldErrors: payload?.errors || {},
    });
  }

  return payload;
}

export const getStudents = () => request('/api/students');
export const getStudent = (id) => request(`/api/students/${id}`);
export const createStudent = (student) => request('/api/students', { method: 'POST', body: student });
export const updateStudent = (id, student) =>
  request(`/api/students/${id}`, { method: 'PUT', body: student });
export const deleteStudent = (id) => request(`/api/students/${id}`, { method: 'DELETE' });
export const getHealth = () => request('/api/health');
