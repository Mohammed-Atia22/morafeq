const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const errorTranslations = {
  "Please provide a valid email": "من فضلك أدخل بريد إلكتروني صحيح",
  "Password is required": "كلمة المرور مطلوبة",
  "Password must be at least 8 characters":
    "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
  "Password must not exceed 50 characters":
    "كلمة المرور يجب ألا تزيد عن 50 حرفا",
  "Password must contain uppercase, lowercase, number, and symbol":
    "كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز",
  "Confirm password is required": "تأكيد كلمة المرور مطلوب",
  "Passwords do not match": "كلمتا المرور غير متطابقتين",
  "First name is required": "الاسم الأول مطلوب",
  "First name must be at least 2 characters":
    "الاسم الأول يجب أن يكون حرفين على الأقل",
  "First name must not exceed 100 characters":
    "الاسم الأول يجب ألا يزيد عن 100 حرف",
  "Last name is required": "اسم العائلة مطلوب",
  "Last name must be at least 2 characters":
    "اسم العائلة يجب أن يكون حرفين على الأقل",
  "Last name must not exceed 100 characters":
    "اسم العائلة يجب ألا يزيد عن 100 حرف",
  "Gender must be male or female": "النوع يجب أن يكون ذكر أو أنثى",
  "Phone is required": "رقم الهاتف مطلوب",
  "Phone must not exceed 20 characters": "رقم الهاتف يجب ألا يزيد عن 20 رقما",
  "Phone must be in international format, e.g. +201001234567":
    "رقم الهاتف يجب أن يكون بالصيغة الدولية مثل +201001234567",
  "OTP is required": "رمز التحقق مطلوب",
  "OTP must be 6 digits": "رمز التحقق يجب أن يكون 6 أرقام",
  "OTP must contain digits only": "رمز التحقق يجب أن يحتوي على أرقام فقط",
  "New password is required": "كلمة المرور الجديدة مطلوبة",
  "This email is already registered": "هذا البريد الإلكتروني مسجل بالفعل",
  "Invalid phone number": "رقم الهاتف غير صحيح",
  "This phone number is already registered": "رقم الهاتف مسجل بالفعل",
  "Email does not exist or is already verified":
    "البريد الإلكتروني غير موجود أو تم تأكيده بالفعل",
  "OTP does not exist": "رمز التحقق غير موجود",
  "OTP is expired": "انتهت صلاحية رمز التحقق",
  "OTP is not correct": "رمز التحقق غير صحيح",
  "Email verified successfully": "تم تأكيد البريد الإلكتروني بنجاح",
  "Invalid credentials": "بيانات تسجيل الدخول غير صحيحة",
  "This account has been deactivated": "تم تعطيل هذا الحساب",
  "This account uses Google login. Please sign in with Google.":
    "هذا الحساب يستخدم تسجيل الدخول عبر Google. من فضلك سجل الدخول عبر Google",
  "Invalid Password": "كلمة المرور غير صحيحة",
  "User not found": "المستخدم غير موجود",
  "This email is not Exsist": "هذا البريد الإلكتروني غير موجود",
  "the Otp is Send": "تم إرسال رمز التحقق",
  "password is not match": "كلمتا المرور غير متطابقتين",
  "password is changed success": "تم تغيير كلمة المرور بنجاح",
  "OTP resent successfully": "تمت إعادة إرسال رمز التحقق بنجاح",
  "Logged out successfully": "تم تسجيل الخروج بنجاح",
  "Internal Server Error": "حدث خطأ في الخادم",
  Unauthorized: "غير مصرح لك",
  Forbidden: "غير مسموح",
};

const translateErrorMessage = (message) => {
  if (!message) {
    return "حدث خطأ ما. حاول مرة أخرى.";
  }

  return errorTranslations[message] || message;
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    const message = data?.message || data?.error;

    if (Array.isArray(message)) {
      return message.map(translateErrorMessage).join("، ");
    }

    if (typeof message === "string") {
      return translateErrorMessage(message);
    }

    return "حدث خطأ ما. حاول مرة أخرى.";
  } catch {
    return "حدث خطأ ما. حاول مرة أخرى.";
  }
};

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("morafeq_access_token");
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

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

export const googleAuthUrl = `${API_URL}/auth/google`;
