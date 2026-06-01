// src/config/apiEndpoints.js
// --------------------------------------------------
// Every backend endpoint string lives here.
// When backend changes a route, you fix it in ONE place.
// --------------------------------------------------

const API = {
  // Auth
  AUTH: {
    LOGIN:           "/auth/login",
    REGISTER:        "/auth/register",
    LOGOUT:          "/auth/logout",
    ME:              "/auth/me",
    REFRESH_TOKEN:   "/auth/refresh",
    LOGIN_GOOGLE:    "/auth/google",
    SEND_OTP:        "/auth/otp/send",
    VERIFY_OTP:      "/auth/otp/verify",
  },

  // Properties
  PROPERTIES: {
    LIST:            "/properties",
    FEATURED:        "/properties/featured",
    DETAIL:          (id) => `/properties/${id}`,
    CREATE:          "/properties",
    UPDATE:          (id) => `/properties/${id}`,
    DELETE:          (id) => `/properties/${id}`,
  },

  // Stats (for landing page)
  STATS: {
    PLATFORM:        "/stats/platform",
  },
};

export default API;