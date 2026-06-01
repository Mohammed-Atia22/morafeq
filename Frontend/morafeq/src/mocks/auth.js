// src/mocks/auth.js
// --------------------------------------------------
// Mock data for all auth-related API responses.
// Field names here = exact field names backend must return.
// --------------------------------------------------

// Simulated delay (ms) — keeps loading states realistic
export const MOCK_DELAY = 800;

// ── Users ────────────────────────────────────────────
export const MOCK_USERS = [
  {
    id: "user_001",
    full_name: "أحمد محمد علي",
    email: "ahmed@example.com",
    phone: "01012345678",
    role: "tenant",            // "tenant" | "owner"
    avatar_url: null,
    is_verified: true,
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "user_002",
    full_name: "سارة خالد",
    email: "sara@example.com",
    phone: "01098765432",
    role: "owner",
    avatar_url: null,
    is_verified: true,
    created_at: "2026-02-01T08:30:00Z",
  },
];

// ── Login response shape ──────────────────────────────
// POST /auth/login → returns this
export const MOCK_LOGIN_RESPONSE = {
  message: "تم تسجيل الدخول بنجاح",
  token: "mock_jwt_token_abc123xyz",
  user: MOCK_USERS[0],
};

// ── Register response shape ───────────────────────────
// POST /auth/register → returns this
export const MOCK_REGISTER_RESPONSE = {
  message: "تم إنشاء الحساب بنجاح",
  token: "mock_jwt_token_newuser456",
  user: {
    id: "user_new",
    full_name: "",       // filled from request body
    email: "",           // filled from request body
    phone: "",           // filled from request body
    role: "tenant",      // default role on register
    avatar_url: null,
    is_verified: false,  // false until OTP verified
    created_at: new Date().toISOString(),
  },
};

// ── OTP response shape ────────────────────────────────
// POST /auth/otp/send → returns this
export const MOCK_OTP_SEND_RESPONSE = {
  message: "تم إرسال رمز التحقق",
  expires_in: 300,       // seconds (5 minutes)
};

// POST /auth/otp/verify → returns this
export const MOCK_OTP_VERIFY_RESPONSE = {
  message: "تم التحقق بنجاح",
  user: { ...MOCK_USERS[0], is_verified: true },
};

// ── Error shapes backend will return ─────────────────
// 401 wrong credentials
export const MOCK_ERROR_INVALID_CREDENTIALS = {
  error: "بيانات الدخول غير صحيحة",
  code: "INVALID_CREDENTIALS",
};

// 409 email already exists
export const MOCK_ERROR_EMAIL_EXISTS = {
  error: "البريد الإلكتروني مستخدم بالفعل",
  code: "EMAIL_ALREADY_EXISTS",
};

// 422 validation error
export const MOCK_ERROR_VALIDATION = {
  error: "بيانات غير صالحة",
  code: "VALIDATION_ERROR",
  fields: {
    email: "صيغة البريد الإلكتروني غير صحيحة",
    password: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
  },
};