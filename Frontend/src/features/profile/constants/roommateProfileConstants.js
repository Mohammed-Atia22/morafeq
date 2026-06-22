// Roommate Profile Constants
// Based on Prisma enums from backend schema.prisma

export const OCCUPATION_TYPES = [
  { value: 'STUDENT', label: 'طالب' },
  { value: 'EMPLOYEE', label: 'موظف' },
  { value: 'FREELANCER', label: 'عمل حر' },
  { value: 'OTHER', label: 'أخرى' },
];

export const AGE_RANGES = [
  { value: 'UNDER_18', label: 'أقل من 18' },
  { value: 'AGE_18_20', label: '18-20' },
  { value: 'AGE_21_23', label: '21-23' },
  { value: 'AGE_24_26', label: '24-26' },
  { value: 'AGE_27_30', label: '27-30' },
  { value: 'ABOVE_30', label: 'أكثر من 30' },
];

export const ROOM_TYPES = [
  { value: 'ENTIRE_PLACE', label: 'المكان بالكامل' },
  { value: 'PRIVATE_ROOM', label: 'غرفة خاصة' },
  { value: 'SHARED_ROOM', label: 'غرفة مشتركة' },
];

export const SLEEP_SCHEDULES = [
  { value: 'EARLY', label: 'مبكر (يستيقظ مبكراً)' },
  { value: 'NORMAL', label: 'عادي' },
  { value: 'LATE', label: 'متأخر (يسهر ليلاً)' },
  { value: 'VARIABLE', label: 'متغير' },
];

export const STUDY_FREQUENCIES = [
  { value: 'RARELY', label: 'نادراً' },
  { value: 'SOMETIMES', label: 'أحياناً' },
  { value: 'OFTEN', label: 'غالباً' },
];

export const CLEANLINESS_LEVELS = [
  { value: 'LOW', label: 'منخفض' },
  { value: 'MEDIUM', label: 'متوسط' },
  { value: 'HIGH', label: 'عالي' },
  { value: 'VERY_HIGH', label: 'عالي جداً' },
];

export const SMOKING_STATUS = [
  { value: 'NON_SMOKER', label: 'غير مدخن' },
  { value: 'SMOKER', label: 'مدخن' },
  { value: 'OCCASIONAL', label: 'مدخن أحياناً' },
];

export const SMOKING_TOLERANCE = [
  { value: 'NEVER', label: 'مطلقاً' },
  { value: 'OUTSIDE_ONLY', label: 'في الخارج فقط' },
  { value: 'OK', label: 'لا بأس' },
];

export const GUEST_PREFERENCES = [
  { value: 'NO_GUESTS', label: 'لا يفضل الضيوف' },
  { value: 'WITH_NOTICE', label: 'مع إشعار مسبق' },
  { value: 'SOMETIMES', label: 'أحياناً' },
  { value: 'OFTEN', label: 'غالباً' },
];

export const PRIVACY_LEVELS = [
  { value: 'HIGH', label: 'عالي' },
  { value: 'MEDIUM', label: 'متوسط' },
  { value: 'SOCIAL', label: 'اجتماعي' },
];

export const COOKING_FREQUENCIES = [
  { value: 'RARELY', label: 'نادراً' },
  { value: 'SOMETIMES', label: 'أحياناً' },
  { value: 'DAILY', label: 'يومياً' },
];

export const EXPENSE_STYLES = [
  { value: 'EQUAL', label: 'تقسيم متساوي' },
  { value: 'BY_USAGE', label: 'حسب الاستخدام' },
  { value: 'AGREEMENT', label: 'اتفاق خاص' },
];

export const CONFLICT_STYLES = [
  { value: 'DIRECT_CALM', label: 'مباشر بهدوء' },
  { value: 'INFORM_HOST', label: 'إبلاغ صاحب السكن' },
  { value: 'AVOID', label: 'تجنب' },
];

export const INTEREST_OPTIONS = [
  { value: 'القراءة', label: 'القراءة' },
  { value: 'الرياضة', label: 'الرياضة' },
  { value: 'الموسيقى', label: 'الموسيقى' },
  { value: 'السفر', label: 'السفر' },
  { value: 'الطبخ', label: 'الطبخ' },
  { value: 'الأفلام', label: 'الأفلام' },
  { value: 'التكنولوجيا', label: 'التكنولوجيا' },
  { value: 'الفنون', label: 'الفنون' },
  { value: 'الألعاب', label: 'الألعاب' },
  { value: 'التصوير', label: 'التصوير' },
  { value: 'الكتابة', label: 'الكتابة' },
  { value: 'التسوق', label: 'التسوق' },
  { value: 'الطبيعة', label: 'الطبيعة' },
  { value: 'التنزه', label: 'التنزه' },
  { value: 'البرمجة', label: 'البرمجة' },
];
