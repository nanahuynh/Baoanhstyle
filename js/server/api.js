// Talks to the PHP API in api/ (see api/index.php).
import { API_URL } from '../config.js';

export async function call(action, body = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}?a=${action}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-BaoAnh': '1' },
      body: JSON.stringify(body)
    });
  } catch {
    throw apiError('auth/network-request-failed', 'Lỗi mạng');
  }
  const json = await res.json().catch(() => null);
  if (!json) throw apiError('internal', 'Server trả về dữ liệu lỗi (' + res.status + ')');
  if (json.error) throw apiError(json.error.code, json.error.message);
  return json;
}

function apiError(code, message) {
  const err = new Error(message || code);
  err.code = code;
  return err;
}
