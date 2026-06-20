export function getSocketBaseUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, "");
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

  return apiUrl.replace(/\/api\/v1\/?$/, "");
}
