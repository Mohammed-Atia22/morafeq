import { useState, useEffect, useCallback } from "react";
import { usersApi } from "../services/usersApi";

const normalizeDialCode = (dialCode) => {
  if (!dialCode) return "";
  return dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
};

const buildProfileForm = (data) => {
  const phoneCountryCode = normalizeDialCode(data.phoneCountryCode);
  const phone = data.phone ?? "";
  const localPhone =
    phoneCountryCode && phone.startsWith(phoneCountryCode)
      ? phone.slice(phoneCountryCode.length)
      : phone.replace(/^\+/, "");

  return {
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    bio: data.bio ?? "",
    phone: localPhone,
    phoneCountry: data.phoneCountry ?? "",
    phoneCountryCode,
    gender: data.gender ?? "",
  };
};

/**
 * Manages all profile operations:
 * - fetch full profile from /users/me
 * - update profile fields
 * - upload avatar
 * - change password
 *
 * Keeps a local `form` state separate from the fetched `profile`
 * so edits don't overwrite the displayed data until saved.
 */
export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await usersApi.getMe();
      // fetch preferences separately and attach if available
      try {
        const prefs = await usersApi.getMyPreferences();
        if (prefs) data.preferences = prefs;
      } catch (e) {
        // silently ignore if preferences endpoint not available
      }
      setProfile(data);
      setForm(buildProfileForm(data));
      return data;
    } catch (err) {
      setError(err.message || "ÙØ´Ù„ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch profile on mount ───────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await usersApi.getMe();
        // try to load preferences and attach
        try {
          const prefs = await usersApi.getMyPreferences();
          if (prefs) data.preferences = prefs;
        } catch (e) {}

        if (!cancelled) {
          setProfile(data);
          // initialise form with fetched values
          setForm(buildProfileForm(data));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "فشل في تحميل الملف الشخصي");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Update a single form field ───────────
  const updateField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Save profile changes ─────────────────
  const saveProfile = useCallback(async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await usersApi.updateProfile({
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        bio: form.bio,
        phone: form.phone || undefined,
        phoneCountry: form.phoneCountry || undefined,
        phoneCountryCode: form.phoneCountryCode || undefined,
        gender: form.gender || undefined,
      });
      setProfile((prev) => ({ ...prev, ...updated }));
      setSuccessMsg("تم حفظ التغييرات بنجاح");
    } catch (err) {
      setError(err.message || "فشل في حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  }, [form]);

  // ─── Upload avatar ────────────────────────
  const uploadAvatar = useCallback(async (file) => {
    setAvatarLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await usersApi.uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatarUrl: updated.avatarUrl }));
      setSuccessMsg("تم تحديث الصورة الشخصية");
    } catch (err) {
      setError(err.message || "فشل في رفع الصورة");
    } finally {
      setAvatarLoading(false);
    }
  }, []);

  // ─── Change password ──────────────────────
  const changePassword = useCallback(async (payload) => {
    setPasswordLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await usersApi.changePassword(payload);
      setSuccessMsg("تم تغيير كلمة المرور بنجاح");
      return true;
    } catch (err) {
      setError(err.message || "فشل في تغيير كلمة المرور");
      return false;
    } finally {
      setPasswordLoading(false);
    }
  }, []);

  // ─── Completeness score (frontend only) ───
  const completeness = profile
    ? (() => {
        const fields = [
          profile.firstName,
          profile.lastName,
          profile.avatarUrl,
          profile.phone,
          profile.bio,
          profile.gender,
          // preferences considered complete when array exists and non-empty
          (profile.preferences && profile.preferences.length > 0) || false,
        ];
        const filled = fields.filter(Boolean).length;
        const profileFieldsScore = Math.round((filled / fields.length) * 90);
        const verificationScore =
          profile.verificationStatus === "APPROVED" ? 10 : 0;

        return Math.min(100, profileFieldsScore + verificationScore);
      })()
    : 0;

  return {
    profile,
    form,
    loading,
    saving,
    avatarLoading,
    passwordLoading,
    error,
    successMsg,
    completeness,
    updateField,
    saveProfile,
    uploadAvatar,
    changePassword,
    loadProfile,
    clearMessages: () => {
      setError(null);
      setSuccessMsg(null);
    },
  };
}
