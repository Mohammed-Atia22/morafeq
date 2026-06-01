// src/services/authService.js
// --------------------------------------------------
// All auth API calls live here.
// Swap VITE_USE_MOCK=false to hit real backend.
// --------------------------------------------------

import config from "../config/env";
import API from "../config/apiEndpoints";
import httpClient from "./httpClient";
import {
  MOCK_DELAY,
  MOCK_LOGIN_RESPONSE,
  MOCK_REGISTER_RESPONSE,
  MOCK_OTP_SEND_RESPONSE,
  MOCK_OTP_VERIFY_RESPONSE,
  MOCK_ERROR_INVALID_CREDENTIALS,
  MOCK_ERROR_EMAIL_EXISTS,
  MOCK_USERS,
} from "../mocks";

const delay = (ms = MOCK_DELAY) => new Promise((res) => setTimeout(res, ms));

// ── Helper: persist auth data after login/register ───
const persistAuth = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// ── Helper: clear auth data on logout ────────────────
const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ─────────────────────────────────────────────────────
const authService = {

  // POST /auth/login
  // body: { email, password }
  login: async ({ email, password }) => {
    if (config.useMock) {
      await delay();

      // Simulate wrong credentials
      const userExists = MOCK_USERS.find((u) => u.email === email);
      if (!userExists || password.length < 6) {
        const error = new Error(MOCK_ERROR_INVALID_CREDENTIALS.error);
        error.code = MOCK_ERROR_INVALID_CREDENTIALS.code;
        throw error;
      }

      const response = {
        ...MOCK_LOGIN_RESPONSE,
        user: userExists,
      };
      persistAuth(response);
      return response;
    }

    const response = await httpClient(API.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persistAuth(response);
    return response;
  },

  // POST /auth/register
  // body: { full_name, email, phone, password, role }
  register: async ({ full_name, email, phone, password, role = "tenant" }) => {
    if (config.useMock) {
      await delay();

      // Simulate email already exists
      const emailTaken = MOCK_USERS.find((u) => u.email === email);
      if (emailTaken) {
        const error = new Error(MOCK_ERROR_EMAIL_EXISTS.error);
        error.code = MOCK_ERROR_EMAIL_EXISTS.code;
        throw error;
      }

      const response = {
        ...MOCK_REGISTER_RESPONSE,
        user: {
          ...MOCK_REGISTER_RESPONSE.user,
          full_name,
          email,
          phone,
          role,
        },
      };
      persistAuth(response);
      return response;
    }

    const response = await httpClient(API.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify({ full_name, email, phone, password, role }),
    });
    persistAuth(response);
    return response;
  },

  // POST /auth/logout
  logout: async () => {
    if (config.useMock) {
      await delay(300);
      clearAuth();
      return { message: "تم تسجيل الخروج" };
    }

    try {
      await httpClient(API.AUTH.LOGOUT, { method: "POST" });
    } finally {
      // Always clear local auth even if request fails
      clearAuth();
    }
    return { message: "تم تسجيل الخروج" };
  },

  // POST /auth/otp/send
  // body: { phone } or { email }
  sendOtp: async ({ phone, email }) => {
    if (config.useMock) {
      await delay();
      return MOCK_OTP_SEND_RESPONSE;
    }

    return httpClient(API.AUTH.SEND_OTP, {
      method: "POST",
      body: JSON.stringify({ phone, email }),
    });
  },

  // POST /auth/otp/verify
  // body: { otp_code, phone } or { otp_code, email }
  verifyOtp: async ({ otp_code, phone, email }) => {
    if (config.useMock) {
      await delay();
      // Any 6-digit code works in mock
      if (otp_code.length !== 6) {
        const error = new Error("رمز التحقق غير صحيح");
        error.code = "INVALID_OTP";
        throw error;
      }
      return MOCK_OTP_VERIFY_RESPONSE;
    }

    return httpClient(API.AUTH.VERIFY_OTP, {
      method: "POST",
      body: JSON.stringify({ otp_code, phone, email }),
    });
  },

  // GET /auth/me  — get current logged-in user
  getMe: async () => {
    if (config.useMock) {
      await delay(300);
      const user = localStorage.getItem("user");
      if (!user) {
        const error = new Error("غير مصرح");
        error.status = 401;
        throw error;
      }
      return { data: JSON.parse(user) };
    }

    return httpClient(API.AUTH.ME);
  },

  // ── Local helpers (no API call needed) ─────────────
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem("token"),

  isLoggedIn: () => !!localStorage.getItem("token"),
};

export default authService;