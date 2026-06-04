import { apiRequest } from "../../../services/api";

export const authApi = {
  register: (payload) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  confirm: (payload) =>
    apiRequest("/auth/confirm", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload) =>
    apiRequest("/auth/forgetPassword", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload) =>
    apiRequest("/auth/resetPassword", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  resendOtp: (payload) =>
    apiRequest("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest("/auth/me"),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
};

export const googleAuthUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1"}/auth/google`;
