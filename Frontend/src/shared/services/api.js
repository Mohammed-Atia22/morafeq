const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

let refreshPromise = null;

const ERROR_TRANSLATIONS = {
  "Access token is missing": "رمز الدخول مفقود. يرجى تسجيل الدخول مرة أخرى.",
  "Invalid token payload": "جلسة الدخول غير صالحة. يرجى تسجيل الدخول مرة أخرى.",
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
  "User not found": "لم يتم العثور على المستخدم",
  "User not found or deactivated": "لم يتم العثور على المستخدم أو تم تعطيل الحساب",
  "Refresh token not found": "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  "Invalid authenticated user": "جلسة المستخدم غير صالحة. يرجى تسجيل الدخول مرة أخرى.",
  "Unauthorized socket": "غير مصرح بالاتصال بالمحادثة",
  "This account is deactivated": "تم تعطيل هذا الحساب",
  "Only hosts can create listings": "يمكن لأصحاب السكن فقط إنشاء عقارات",
  "Only admins can review verifications": "هذه العملية متاحة للمسؤول فقط",
  "Listing not found": "لم يتم العثور على العقار",
  "Listing not found or not available": "لم يتم العثور على العقار أو أنه غير متاح",
  "Apartment is already saved": "هذه الشقة محفوظة بالفعل",
  "Photo not found": "لم يتم العثور على الصورة",
  "Room not found": "لم يتم العثور على الغرفة",
  "Booking not found": "لم يتم العثور على الحجز",
  "Conversation not found": "لم يتم العثور على المحادثة",
  "Review not found": "لم يتم العثور على التقييم",
  "Host not found": "لم يتم العثور على صاحب السكن",
  "Verification not found": "لم يتم العثور على طلب التوثيق",
  "No payment found for this booking": "لم يتم العثور على دفعة لهذا الحجز",
  "Could not generate location insight": "تعذر إنشاء تحليل المنطقة",
  "Invalid availableFrom date": "تاريخ الإتاحة غير صحيح",
  "Invalid coordinates returned from map provider": "عاد مزود الخرائط بإحداثيات غير صحيحة",
  "limit must be a positive integer": "يجب أن يكون الحد رقمًا صحيحًا موجبًا",
  "Please upload ID front, ID back, and a selfie with your ID":
    "يرجى رفع صورة وجه البطاقة وظهر البطاقة وصورة شخصية مع البطاقة",
  "Verification documents submitted for review": "تم إرسال مستندات التوثيق للمراجعة",
  "Please upload an avatar image": "يرجى رفع صورة شخصية",
  "Current password is incorrect": "كلمة المرور الحالية غير صحيحة",
  "You are already a host": "أنت مسجل بالفعل كصاحب سكن",
  "Please upload at least one photo": "يرجى رفع صورة واحدة على الأقل",
  "Maximum 20 photos allowed per listing": "الحد الأقصى 20 صورة لكل عقار",
  "You cannot book your own listing": "لا يمكنك حجز عقارك الخاص",
  "You can only pay for your own bookings": "يمكنك الدفع لحجوزاتك فقط",
  "This booking has already been paid": "تم دفع هذا الحجز بالفعل",
  "Invalid webhook signature": "توقيع عملية الدفع غير صالح",
  "Payment amount mismatch": "قيمة الدفع غير مطابقة",
  "Payment currency mismatch": "عملة الدفع غير مطابقة",
  "Only the host can mark a booking as completed": "يمكن لصاحب السكن فقط تأكيد اكتمال الحجز",
  "Only confirmed bookings can be completed": "يمكن إكمال الحجوزات المؤكدة فقط",
  "You can only delete your own reviews": "يمكنك حذف تقييماتك فقط",
  "Socket is not connected": "الاتصال بالمحادثة غير متاح حاليًا",
  "Invalid conversation ID": "رقم المحادثة غير صحيح",
  "Could not join conversation": "تعذر فتح المحادثة",
  "Message cannot be empty": "لا يمكن إرسال رسالة فارغة",
  "Could not send message": "تعذر إرسال الرسالة",
  "Could not mark messages as read": "تعذر تعليم الرسائل كمقروءة",
  "Socket markAsRead timeout": "انتهت مهلة تعليم الرسائل كمقروءة",
  "No payment session URL returned": "تعذر تجهيز رابط الدفع",
  "Failed to create payment session": "تعذر بدء عملية الدفع",
  "Failed to load user": "تعذر تحميل بيانات المستخدم",
  "Failed to load wallet data": "تعذر تحميل بيانات المحفظة",
  "Failed to load complaints": "تعذر تحميل الشكاوى",
  "Failed to load requests": "تعذر تحميل الطلبات",
  "Failed to respond to request": "تعذر إرسال الرد على الطلب",
  "Failed to load users": "تعذر تحميل المستخدمين",
  "Failed to load admin stats": "تعذر تحميل إحصائيات الإدارة",
  "Failed to load listings": "تعذر تحميل العقارات",
  "Failed to load bookings": "تعذر تحميل الحجوزات",
  "Failed to create booking": "تعذر إنشاء الحجز",
  "Failed to confirm receipt": "تعذر تأكيد الاستلام",
  "Failed to report problem": "تعذر إرسال الشكوى",
  "Failed to cancel booking": "تعذر إلغاء الحجز",
  "Failed to continue booking": "تعذر متابعة الحجز",
  "Failed to cancel after dispute": "تعذر إلغاء الحجز بعد النزاع",
};

export const translateErrorMessage = (message) => {
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
