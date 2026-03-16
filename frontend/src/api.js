const BASE = '/api';

function getToken() {
  return localStorage.getItem('plask_token') || '';
}

function authHeaders(withBody = false) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (withBody) h['Content-Type'] = 'application/json';
  return h;
}

async function request(method, path, body) {
  const hasBody = body !== undefined;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || '서버 오류가 발생했습니다.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};

// Auth (no token needed)
export async function authRequest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || '서버 오류가 발생했습니다.');
    err.status = res.status;
    throw err;
  }
  return data;
}
