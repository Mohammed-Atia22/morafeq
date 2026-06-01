// src/hooks/useAuth.js
// --------------------------------------------------
// Handles all auth actions + current user state.
// Components never call authService directly — they use this.
// --------------------------------------------------

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const useAuth = () => {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────
  const [user,    setUser]    = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);   // string | null
  const [fields,  setFields]  = useState({});      // field-level validation errors

  // ── Clear errors before each action ───────────────
  const resetErrors = () => {
    setError(null);
    setFields({});
  };

  // ── Login ──────────────────────────────────────────
  // usage: const { login, loading, error } = useAuth();
  //        await login({ email, password });
  const login = useCallback(async ({ email, password }) => {
    resetErrors();
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      navigate("/");           // redirect to home after login
      return response;
    } catch (err) {
      setError(err.message);
      if (err.fields) setFields(err.fields);
      return null;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Register ───────────────────────────────────────
  // usage: await register({ full_name, email, phone, password, role });
  const register = useCallback(async (formData) => {
    resetErrors();
    setLoading(true);
    try {
      const response = await authService.register(formData);
      setUser(response.user);
      navigate("/");           // redirect to home after register
      return response;
    } catch (err) {
      setError(err.message);
      if (err.fields) setFields(err.fields);
      return null;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Logout ─────────────────────────────────────────
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Send OTP ───────────────────────────────────────
  const sendOtp = useCallback(async ({ phone, email }) => {
    resetErrors();
    setLoading(true);
    try {
      const response = await authService.sendOtp({ phone, email });
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Verify OTP ─────────────────────────────────────
  const verifyOtp = useCallback(async ({ otp_code, phone, email }) => {
    resetErrors();
    setLoading(true);
    try {
      const response = await authService.verifyOtp({ otp_code, phone, email });
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────
  return {
    // State
    user,
    loading,
    error,
    fields,           // e.g. { email: "صيغة غير صحيحة" } for inline field errors
    isLoggedIn: !!user,

    // Actions
    login,
    register,
    logout,
    sendOtp,
    verifyOtp,
  };
};

export default useAuth;