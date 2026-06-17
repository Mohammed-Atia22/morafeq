import { useEffect } from "react";
import { useProfile } from "../hooks/useProfile";
import { AvatarUploader } from "../components/AvatarUploader";
import { ProfileInfoForm } from "../components/ProfileInfoForm";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { ProfileCompleteness } from "../components/ProfileCompleteness";
import { useVerification } from "../../verification/hooks/useVerification";
import { VerificationBadge } from "../../verification/components/VerificationBadge";
import { VerificationPanel } from "../../verification/components/VerificationPanel";

// ─── Skeleton ─────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 animate-pulse px-4 sm:px-6">
      <div className="h-28 rounded-2xl bg-slate-200" />
      <div className="h-64 rounded-2xl bg-slate-200" />
      <div className="h-48 rounded-2xl bg-slate-200" />
      <div className="h-52 rounded-2xl bg-slate-200" />
    </div>
  );
}

// ─── Banner ───────────────────────────────────
function Banner({ type, message, onClose }) {
  if (!message) return null;

  const styles =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-red-50 text-red-600 ring-red-200";

  return (
    <div
      dir="rtl"
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ring-1 ${styles}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="mr-3 text-current opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────
export function ProfilePage() {
  const {
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
    clearMessages,
  } = useProfile();
  const {
    verification,
    loading: verificationLoading,
    submitting: verificationSubmitting,
    error: verificationError,
    successMsg: verificationSuccessMsg,
    submitDocuments,
    clearMessages: clearVerificationMessages,
  } = useVerification({
    onSubmitted: () => {
      loadProfile();
    },
  });

  // Auto-clear success message after 4 seconds
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(clearMessages, 4000);
    return () => clearTimeout(t);
  }, [successMsg, clearMessages]);

  if (loading) return <ProfileSkeleton />;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-3xl space-y-5 px-4 sm:px-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-black text-[#0f172a]">الملف الشخصي</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          أدر معلوماتك الشخصية وإعدادات حسابك
        </p>
      </div>

      {/* Banners */}
      <Banner type="success" message={successMsg} onClose={clearMessages} />
      <Banner type="error" message={error} onClose={clearMessages} />

      {/* Completeness */}
      <ProfileCompleteness profile={profile} completeness={completeness} />

      <VerificationPanel
        verification={{
          ...verification,
          status: profile?.verificationStatus ?? verification?.status,
        }}
        loading={verificationLoading}
        submitting={verificationSubmitting}
        error={verificationError}
        successMsg={verificationSuccessMsg}
        onSubmit={submitDocuments}
        onClearMessages={clearVerificationMessages}
      />

      {/* Avatar card */}
      <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-5 text-sm font-black text-[#0f172a]">
          الصورة الشخصية
        </h2>
        <AvatarUploader
          avatarUrl={profile?.avatarUrl}
          firstName={profile?.firstName}
          loading={avatarLoading}
          onUpload={uploadAvatar}
        />
      </div>

      {/* Info form */}
      <ProfileInfoForm form={form} onChange={updateField} />

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="rounded-xl bg-[#1752F0] px-8 py-3 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60"
        >
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      {/* Account info — read only */}
      <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-sm font-black text-[#0f172a]">
          معلومات الحساب
        </h2>
        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">البريد الإلكتروني</p>
              <p className="text-sm font-semibold text-[#0f172a]">
                {profile?.email}
              </p>
            </div>
            <VerificationBadge status={profile?.verificationStatus} compact />
          </div>

          {/* Role */}
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-400">نوع الحساب</p>
            <p className="text-sm font-semibold text-[#0f172a]">
              {profile?.role === "HOST"
                ? "مالك عقار"
                : profile?.role === "ADMIN"
                  ? "مدير"
                  : "طالب مغترب"}
            </p>
          </div>

          {/* Member since */}
          {profile?.createdAt && (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">عضو منذ</p>
              <p className="text-sm font-semibold text-[#0f172a]">
                {new Date(profile.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Change password — only for email/password users */}
      {profile?.passwordHash && (
        <ChangePasswordForm
          loading={passwordLoading}
          onSubmit={changePassword}
        />
      )}
    </div>
  );
}
