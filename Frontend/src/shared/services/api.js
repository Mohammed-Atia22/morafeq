const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

let refreshPromise = null;

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    const message = data?.message || data?.error;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }

    return "حدث خطأ ما. حاول مرة أخرى.";
  } catch {
    return "حدث خطأ ما. حاول مرة أخرى.";
  }
};

const refreshAccessToken = async () => {
  refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      return response.json();
    })
    .then((data) => {
      if (!data?.accessToken) {
        throw new Error("Session expired. Please login again.");
      }

      localStorage.setItem("morafeq_access_token", data.accessToken);
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const clearSession = () => {
  localStorage.removeItem("morafeq_access_token");
  localStorage.removeItem("morafeq_user");
};

export async function apiRequest(path, options = {}, retry = true) {
  const token = localStorage.getItem("morafeq_access_token");
  const method = options.method?.toUpperCase() || "GET";
  const isJsonRequest = method !== "GET" || options.body != null;

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(isJsonRequest ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (
    response.status === 401 &&
    retry &&
    path !== "/auth/login" &&
    path !== "/auth/refresh"
  ) {
    try {
      await refreshAccessToken();
      return apiRequest(path, options, false);
    } catch {
      clearSession();
    }
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
