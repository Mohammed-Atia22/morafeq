import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../services/usersApi";
import {
  OCCUPATION_TYPES,
  AGE_RANGES,
  ROOM_TYPES,
  SLEEP_SCHEDULES,
  STUDY_FREQUENCIES,
  CLEANLINESS_LEVELS,
  SMOKING_STATUS,
  SMOKING_TOLERANCE,
  GUEST_PREFERENCES,
  PRIVACY_LEVELS,
  COOKING_FREQUENCIES,
  EXPENSE_STYLES,
  CONFLICT_STYLES,
  INTEREST_OPTIONS,
} from "../constants/roommateProfileConstants";

const STEPS = [
  { id: 1, title: "الدراسة والسكن" },
  { id: 2, title: "نمط الحياة" },
  { id: 3, title: "التعايش المشترك" },
];

const ROOMMATE_PROFILE_FIELDS = [
  "occupationType",
  "university",
  "faculty",
  "academicYear",
  "ageRange",
  "preferredMinRent",
  "preferredMaxRent",
  "preferredRoomType",
  "preferredCity",
  "preferredGovernorate",
  "sleepSchedule",
  "studyFrequency",
  "cleanlinessLevel",
  "smokingStatus",
  "smokingTolerance",
  "guestPreference",
  "privacyLevel",
  "cookingFrequency",
  "expenseStyle",
  "conflictStyle",
  "interests",
];

const initialRoommateProfileForm = {
  occupationType: "",
  university: "",
  faculty: "",
  academicYear: "",
  ageRange: "",
  preferredMinRent: "",
  preferredMaxRent: "",
  preferredRoomType: "",
  preferredCity: "",
  preferredGovernorate: "",
  sleepSchedule: "",
  studyFrequency: "",
  cleanlinessLevel: "",
  smokingStatus: "",
  smokingTolerance: "",
  guestPreference: "",
  privacyLevel: "",
  cookingFrequency: "",
  expenseStyle: "",
  conflictStyle: "",
  interests: [],
};

const normalizeRoommateProfileForm = (profile = {}) =>
  ROOMMATE_PROFILE_FIELDS.reduce(
    (acc, field) => {
      if (field === "interests") {
        acc.interests = Array.isArray(profile.interests) ? profile.interests : [];
        return acc;
      }

      acc[field] = profile[field] ?? "";
      return acc;
    },
    { ...initialRoommateProfileForm }
  );

const buildRoommateProfilePayload = (formData) => {
  const payload = normalizeRoommateProfileForm(formData);

  return {
    ...payload,
    preferredMinRent: payload.preferredMinRent
      ? parseInt(payload.preferredMinRent, 10)
      : null,
    preferredMaxRent: payload.preferredMaxRent
      ? parseInt(payload.preferredMaxRent, 10)
      : null,
  };
};

export function RoommateProfileForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: الدراسة والسكن
    occupationType: "",
    university: "",
    faculty: "",
    academicYear: "",
    ageRange: "",
    preferredMinRent: "",
    preferredMaxRent: "",
    preferredRoomType: "",
    preferredCity: "",
    preferredGovernorate: "",
    // Step 2: نمط الحياة
    sleepSchedule: "",
    studyFrequency: "",
    cleanlinessLevel: "",
    smokingStatus: "",
    smokingTolerance: "",
    // Step 3: التعايش المشترك
    guestPreference: "",
    privacyLevel: "",
    cookingFrequency: "",
    expenseStyle: "",
    conflictStyle: "",
    interests: [],
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load existing profile if any
        const profileResp = await usersApi.getMyRoommateProfile();
        if (profileResp?.isCompleted && profileResp?.profile) {
          setExistingProfile(profileResp.profile);
          setFormData(normalizeRoommateProfileForm(profileResp.profile));
        }
      } catch (e) {
        setError(e.message || "فشل في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => {
      const current = prev.interests || [];
      if (current.includes(interest)) {
        return { ...prev, interests: current.filter((i) => i !== interest) };
      }
      return { ...prev, interests: [...current, interest] };
    });
  };

  const validateStep = (step) => {
    const errors = [];

    if (step === 1) {
      if (!formData.occupationType) errors.push("نوع الدراسة/العمل مطلوب");
      if (!formData.university) errors.push("الجامعة مطلوبة");
      if (!formData.faculty) errors.push("الكلية مطلوبة");
      if (!formData.academicYear) errors.push("الفرقة الدراسية مطلوبة");
      if (!formData.ageRange) errors.push("الفئة العمرية مطلوبة");
      if (!formData.preferredMinRent) errors.push("الحد الأدنى للإيجار مطلوب");
      if (!formData.preferredMaxRent) errors.push("الحد الأقصى للإيجار مطلوب");
      if (!formData.preferredRoomType) errors.push("نوع الغرفة المفضل مطلوب");
      if (!formData.preferredCity) errors.push("المدينة المفضلة مطلوبة");
      if (!formData.preferredGovernorate) errors.push("المحافظة مطلوبة");
    }

    if (step === 2) {
      if (!formData.sleepSchedule) errors.push("مواعيد النوم مطلوبة");
      if (!formData.studyFrequency) errors.push("معدل الدراسة مطلوب");
      if (!formData.cleanlinessLevel) errors.push("مستوى النظافة مطلوب");
      if (!formData.smokingStatus) errors.push("حالة التدخين مطلوبة");
      if (!formData.smokingTolerance) errors.push("تسامح التدخين مطلوب");
    }

    if (step === 3) {
      if (!formData.guestPreference) errors.push("تفضيل الضيوف مطلوب");
      if (!formData.privacyLevel) errors.push("مستوى الخصوصية مطلوب");
      if (!formData.cookingFrequency) errors.push("معدل الطبخ مطلوب");
      if (!formData.expenseStyle) errors.push("أسلوب المصاريف مطلوب");
      if (!formData.conflictStyle) errors.push("أسلوب حل النزاعات مطلوب");
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }
    setError(null);
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const errors = validateStep(3);
    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }
    setError(null);

    setSaving(true);
    try {
      const payload = buildRoommateProfilePayload(formData);
      await usersApi.updateMyRoommateProfile(payload);
      setSuccess("تم حفظ بيانات التوافق بنجاح");
      setTimeout(() => {
        navigate("/expatriate/profile");
      }, 1500);
    } catch (e) {
      setError(e.message || "فشل في حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-6 p-4">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-black text-[#0f172a]">
          {existingProfile ? "تعديل بيانات التوافق" : "إكمال بيانات التوافق"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          ساعدنا في إيجاد الزملاء المناسبين لك من خلال إكمال بيانات توافقك
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-black ${
                  currentStep >= step.id
                    ? "bg-[#1752F0] text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.id}
              </div>
              <span
                className={`mt-2 text-xs font-bold ${
                  currentStep >= step.id
                    ? "text-[#1752F0]"
                    : "text-slate-400"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep > step.id ? "bg-[#1752F0]" : "bg-slate-100"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error/Success */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Form Content */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {currentStep === 1 && <Step1 formData={formData} onChange={handleChange} />}
        {currentStep === 2 && <Step2 formData={formData} onChange={handleChange} />}
        {currentStep === 3 && <Step3 formData={formData} onChange={handleChange} onInterestToggle={handleInterestToggle} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"
        >
          السابق
        </button>
        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-xl bg-[#1752F0] px-6 py-2.5 text-sm font-black text-white shadow transition hover:bg-[#1240c4]"
          >
            التالي
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-[#1752F0] px-6 py-2.5 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
        )}
      </div>
    </div>
  );
}

function Step1({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-[#0f172a]">الدراسة والسكن</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            نوع الدراسة/العمل
          </label>
          <select
            value={formData.occupationType}
            onChange={(e) => onChange("occupationType", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {OCCUPATION_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">الجامعة</label>
          <input
            type="text"
            value={formData.university}
            onChange={(e) => onChange("university", e.target.value)}
            placeholder="أدخل اسم الجامعة"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">الكلية</label>
          <input
            type="text"
            value={formData.faculty}
            onChange={(e) => onChange("faculty", e.target.value)}
            placeholder="أدخل اسم الكلية"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            الفرقة الدراسية
          </label>
          <input
            type="text"
            value={formData.academicYear}
            onChange={(e) => onChange("academicYear", e.target.value)}
            placeholder="مثال: الأولى، الثانية، الثالثة"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            الفئة العمرية
          </label>
          <select
            value={formData.ageRange}
            onChange={(e) => onChange("ageRange", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {AGE_RANGES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            الحد الأدنى للإيجار (ج.م)
          </label>
          <input
            type="number"
            value={formData.preferredMinRent}
            onChange={(e) => onChange("preferredMinRent", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
            placeholder="مثال: 1000"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            الحد الأقصى للإيجار (ج.م)
          </label>
          <input
            type="number"
            value={formData.preferredMaxRent}
            onChange={(e) => onChange("preferredMaxRent", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
            placeholder="مثال: 3000"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            نوع الغرفة المفضل
          </label>
          <select
            value={formData.preferredRoomType}
            onChange={(e) => onChange("preferredRoomType", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {ROOM_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            المحافظة
          </label>
          <input
            type="text"
            value={formData.preferredGovernorate}
            onChange={(e) => onChange("preferredGovernorate", e.target.value)}
            placeholder="مثال: القاهرة، الجيزة، الإسكندرية"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            المدينة المفضلة
          </label>
          <input
            type="text"
            value={formData.preferredCity}
            onChange={(e) => onChange("preferredCity", e.target.value)}
            placeholder="مثال: مدينة نصر، المهندسين، وسط البلد"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-[#0f172a]">نمط الحياة</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            مواعيد النوم
          </label>
          <select
            value={formData.sleepSchedule}
            onChange={(e) => onChange("sleepSchedule", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {SLEEP_SCHEDULES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            معدل الدراسة
          </label>
          <select
            value={formData.studyFrequency}
            onChange={(e) => onChange("studyFrequency", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {STUDY_FREQUENCIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            مستوى النظافة
          </label>
          <select
            value={formData.cleanlinessLevel}
            onChange={(e) => onChange("cleanlinessLevel", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {CLEANLINESS_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            حالة التدخين
          </label>
          <select
            value={formData.smokingStatus}
            onChange={(e) => onChange("smokingStatus", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {SMOKING_STATUS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            تسامح التدخين
          </label>
          <select
            value={formData.smokingTolerance}
            onChange={(e) => onChange("smokingTolerance", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {SMOKING_TOLERANCE.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Step3({ formData, onChange, onInterestToggle }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-[#0f172a]">التعايش المشترك</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            تفضيل الضيوف
          </label>
          <select
            value={formData.guestPreference}
            onChange={(e) => onChange("guestPreference", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {GUEST_PREFERENCES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            مستوى الخصوصية
          </label>
          <select
            value={formData.privacyLevel}
            onChange={(e) => onChange("privacyLevel", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {PRIVACY_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            معدل الطبخ
          </label>
          <select
            value={formData.cookingFrequency}
            onChange={(e) => onChange("cookingFrequency", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {COOKING_FREQUENCIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            أسلوب المصاريف
          </label>
          <select
            value={formData.expenseStyle}
            onChange={(e) => onChange("expenseStyle", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {EXPENSE_STYLES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            أسلوب حل النزاعات
          </label>
          <select
            value={formData.conflictStyle}
            onChange={(e) => onChange("conflictStyle", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-[#1752F0] focus:outline-none focus:ring-2 focus:ring-[#1752F0]/20"
          >
            <option value="">اختر</option>
            {CONFLICT_STYLES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            الاهتمامات (اختر ما ينطبق عليك)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest.value}
                type="button"
                onClick={() => onInterestToggle(interest.value)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  formData.interests?.includes(interest.value)
                    ? "bg-[#1752F0] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {interest.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
