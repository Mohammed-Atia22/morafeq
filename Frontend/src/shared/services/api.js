const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

let refreshPromise = null;

const ERROR_TRANSLATIONS = {
  "Please provide a valid email": "أدخل بريد إلكتروني صحيح",
  "Validation error": "أدخل بريد إلكتروني صحيح",
  "No account found with this email": "لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني",
  "Invalid credentials": "يرجى التحقق من البريد الإلكتروني وكلمة المرور والمحاولة مرة أخرى.",
  "OTP is required": "رمز التحقق مطلوب",
  "OTP must be 6 digits": "رمز التحقق يجب أن يكون 6 أرقام",
  "OTP must contain digits only": "رمز التحقق يجب أن يحتوي على أرقام فقط",
  "OTP does not exist. Please request a new one.": "لم يتم إرسال رمز التحقق أو انتهت صلاحيته. اطلب رمزًا جديدًا.",
  "OTP has expired. Please request a new one.": "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.",
  "OTP is incorrect": "رمز التحقق غير صحيح",
  "Email does not exist or is already verified": "لم يتم العثور على حساب يحتاج إلى تأكيد بهذا البريد الإلكتروني",
  "Passwords do not match": "كلمتا المرور غير متطابقتين",
  "New password is required": "كلمة المرور الجديدة مطلوبة",
  "Password must be at least 8 characters": "كلمة المرور يجب ألا تقل عن 8 أحرف",
  "Password must not exceed 50 characters": "كلمة المرور يجب ألا تزيد عن 50 حرف",
  "Password must contain uppercase, lowercase, number, and symbol": "استخدم حرف كبير وصغير ورقم ورمز",
  "Confirm password is required": "تأكيد كلمة المرور مطلوب",
  "Session expired. Please login again.": "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  "This account uses Google login. Please sign in with Google.": "هذا الحساب يستخدم تسجيل الدخول عبر جوجل.",
  "This account has been deactivated": "تم تعطيل هذا الحساب.",
};

const translateErrorMessage = (message) => {
  if (Array.isArray(message)) {
    return message.map(translateErrorMessage).join(", ");
  }

  if (typeof message !== "string") {
    return "حدث خطأ ما. حاول مرة أخرى.";
  }

  return ERROR_TRANSLATIONS[message] || message;
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    const message = data?.message || data?.error;

    if (typeof message === "string") {
      return translateErrorMessage(message);
    }

    if (Array.isArray(message)) {
      return translateErrorMessage(message);
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
        throw new Error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.");
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
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const isJsonRequest = !isFormData && (method !== "GET" || options.body != null);
  const { headers: optionHeaders, ...fetchOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...fetchOptions,
    headers: {
      ...(isJsonRequest ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...optionHeaders,
    },
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
