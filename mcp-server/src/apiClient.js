// Thin client for the Student API (the Express backend in ../backend).
// The MCP server never touches MongoDB directly: every operation goes through the
// REST API, so the backend's validation rules stay the single source of truth.

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function createApiClient({ baseUrl, timeoutMs = 30000, fetchImpl = fetch }) {
  const root = baseUrl.replace(/\/+$/, '');

  async function request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(`${root}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ApiError(
          `The API did not answer within ${timeoutMs / 1000}s. A free Render service may be waking up; try again in a minute.`,
          504
        );
      }
      throw new ApiError(`Could not reach the API at ${root}: ${err.message}`, 502);
    } finally {
      clearTimeout(timer);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    // /api/health answers 503 with a useful body when the database is down,
    // so callers of health() get the payload either way.
    if (!response.ok && !(path === '/api/health' && payload)) {
      throw new ApiError(
        (payload && payload.message) || `API returned HTTP ${response.status}`,
        response.status,
        payload && payload.errors
      );
    }
    return payload;
  }

  return {
    health: () => request('GET', '/api/health'),
    listStudents: async () => (await request('GET', '/api/students')).data,
    getStudent: async (id) => (await request('GET', `/api/students/${encodeURIComponent(id)}`)).data,
    createStudent: async (student) => (await request('POST', '/api/students', student)).data,
    updateStudent: async (id, student) =>
      (await request('PUT', `/api/students/${encodeURIComponent(id)}`, student)).data,
    deleteStudent: async (id) => (await request('DELETE', `/api/students/${encodeURIComponent(id)}`)).data,
  };
}

module.exports = { createApiClient, ApiError };
