// src/config/env.js
// --------------------------------------------------
// All environment variables go through here.
// Never use import.meta.env directly in components.
// --------------------------------------------------

const config = {
  apiUrl:   import.meta.env.VITE_API_URL  || "http://localhost:8000/api",
  useMock:  import.meta.env.VITE_USE_MOCK === "true",
  appName:  import.meta.env.VITE_APP_NAME || "مرافق",
};

export default config;