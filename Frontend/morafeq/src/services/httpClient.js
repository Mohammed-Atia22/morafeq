// src/services/httpClient.js
// --------------------------------------------------
// Base fetch wrapper. Handles:
//   - Base URL prefix
//   - Auth token injection
//   - JSON parsing
//   - Error normalization
// All services use this — never call fetch() directly.
// --------------------------------------------------

import config from "../config/env";

const getToken = () => localStorage.getItem("token");

const httpClient = async (endpoint, options = {}) => {
  const url = `${config.apiUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Try to parse JSON regardless of status
  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: "فشل في قراءة الاستجابة من الخادم" };
  }

  // Treat non-2xx as errors
  if (!response.ok) {
    const error = new Error(data.error || "حدث خطأ غير متوقع");
    error.code    = data.code    || "UNKNOWN_ERROR";
    error.fields  = data.fields  || null;
    error.status  = response.status;
    throw error;
  }

  return data;
};

export default httpClient;