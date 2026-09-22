const API_URL = import.meta.env.VITE_API_URL || "";

export async function api(path, { token, body, ...options } = {}) {
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...options, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function socketUrl() {
  return import.meta.env.VITE_SOCKET_URL || API_URL || window.location.origin;
}
