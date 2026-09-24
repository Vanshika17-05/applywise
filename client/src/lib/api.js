const API_URL = import.meta.env.VITE_API_URL || "";

export async function api(path, { token, body, ...options } = {}) {
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...options, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function downloadApi(path, { token, fallbackName = "applywise-export.csv" } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Export failed");
  }
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function streamApi(path, { token, body, onEvent, signal } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }
  if (!response.body) throw new Error("Streaming is not supported by this browser.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      onEvent?.(event);
      if (event.type === "error") throw new Error(event.message || "AI generation failed");
    }
    if (done) break;
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer);
    onEvent?.(event);
    if (event.type === "error") throw new Error(event.message || "AI generation failed");
  }
}

export function socketUrl() {
  return import.meta.env.VITE_SOCKET_URL || API_URL || window.location.origin;
}
