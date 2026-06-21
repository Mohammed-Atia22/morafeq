import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { AvatarUploader } from "../components/AvatarUploader";
import { ProfileInfoForm } from "../components/ProfileInfoForm";
import { PreferencesSection } from "../components/PreferencesSection";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { useVerification } from "../../verification/hooks/useVerification";
import { VerificationBadge } from "../../verification/components/VerificationBadge";
import { VerificationPanel } from "../../verification/components/VerificationPanel";
import { UserReviewsSection } from "../../reviews/components/UserReviewsSection";
import { useFavorites } from "../../favorites/hooks/useFavorites";
import { useFavoriteToggle } from "../../favorites/hooks/useFavoriteToggle";
import { ListingCard } from "../../expatriate/components/home/ListingCard";

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 animate-pulse px-1">
      <div className="h-40 rounded-2xl bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-2xl bg-slate-200" />
        <div className="h-20 rounded-2xl bg-slate-200" />
        <div className="h-20 rounded-2xl bg-slate-200" />
      </div>
      <div className="h-56 rounded-2xl bg-slate-200" />
    </div>
  );
}

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
        إغلاق
      </button>
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-black text-[#0f172a]">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm ring-1 ring-slate-100">
      <p className="text-2xl font-black text-[#1752F0]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ProfileHeader({ profile, completeness, onEdit }) {
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "المستخدم";
  const initials = profile?.firstName?.charAt(0)?.toUpperCase() ?? "م";

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="الصورة الشخصية"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-[#EEF3FF]"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full bg-[#1752F0] text-3xl font-black text-white ring-4 ring-[#EEF3FF]">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-black text-[#0f172a]">
                {fullName}
              </h1>
              <VerificationBadge status={profile?.verificationStatus} compact />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {profile?.role === "HOST"
                ? "مالك عقار"
                : profile?.role === "ADMIN"
                  ? "مدير"
                  : "طالب مغترب"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
              <span>
                التقييم والثقة:{" "}
                {Number(profile?.trustScore ?? 0).toLocaleString("ar-EG")}
              </span>
              <span>اكتمال الملف: {completeness.toLocaleString("ar-EG")}%</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center rounded-xl border border-[#1752F0] px-4 py-2 text-sm font-black text-[#1752F0] transition hover:bg-[#EEF3FF]"
        >
          ✏️ تعديل الملف الشخصي
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>اكتمال الملف الشخصي</span>
          <span>{completeness.toLocaleString("ar-EG")}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#1752F0] transition-all duration-700"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function AccountInfo({ profile }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-400">البريد الإلكتروني</p>
        <p className="mt-1 break-all text-sm font-bold text-[#0f172a]">
          {profile?.email}
        </p>
      </div>
      <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-400">رقم الهاتف</p>
        <p className="mt-1 text-sm font-bold text-[#0f172a]">
          {profile?.phone || "غير مضاف"}
        </p>
      </div>
      <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-400">نوع الحساب</p>
        <p className="mt-1 text-sm font-bold text-[#0f172a]">
          {profile?.role === "HOST"
            ? "مالك عقار"
            : profile?.role === "ADMIN"
              ? "مدير"
              : "طالب مغترب"}
        </p>
      </div>
      <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-400">عضو منذ</p>
        <p className="mt-1 text-sm font-bold text-[#0f172a]">
          {profile?.createdAt
            ? new Date(profile.createdAt).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
              })
            : "غير متاح"}
        </p>
      </div>
      {profile?.bio && (
        <div className="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
          <p className="text-xs text-slate-400">نبذة شخصية</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#0f172a]">
            {profile.bio}
          </p>
        </div>
      )}
    </div>
  );
}

function FavoritesPreview({
  favorites,
  total,
  loading,
  onFavoriteToggle,
  pendingFavoriteIds,
  profileRole,
}) {
  const favoritesPath = "/expatriate/favorites";

  return (
    <SectionCard
      title="الشقق المحفوظة ❤️"
      action={
        <Link
          to={favoritesPath}
          className="text-xs font-black text-[#1752F0] hover:text-[#1240c4]"
        >
          عرض الكل
        </Link>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {total > 0
            ? `${total.toLocaleString("ar-EG")} شقة محفوظة`
            : "لا توجد شقق محفوظة حالياً."}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onFavoriteToggle={onFavoriteToggle}
              favoritePending={pendingFavoriteIds?.has?.(listing.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 py-10 text-center text-sm font-semibold text-slate-500">
          لا توجد شقق محفوظة حالياً.
        </div>
      )}
    </SectionCard>
  );
}

function EditProfileModal({
  open,
  onClose,
  profile,
  form,
  saving,
  avatarLoading,
  onChange,
  onSave,
  onUpload,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="إغلاق"
      />
      <div
        dir="rtl"
        className="relative max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-black text-[#0f172a]">
            تعديل الملف الشخصي
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-50"
          >
            إغلاق
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl bg-slate-50 px-5 py-4">
            <AvatarUploader
              avatarUrl={profile?.avatarUrl}
              firstName={profile?.firstName}
              loading={avatarLoading}
              onUpload={onUpload}
            />
          </div>
          <ProfileInfoForm form={form} onChange={onChange} />
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-[#1752F0] px-6 py-2.5 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
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
    visibleFavorites,
    total: favoriteTotal,
    loading: favoritesLoading,
    setFavoriteState,
  } = useFavorites({ limit: 3 });

  const handleFavoriteChanged = useCallback(
    (listingId, isFavorited, listing) => {
      setFavoriteState(listingId, isFavorited, listing);
    },
    [setFavoriteState],
  );

  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    onChanged: handleFavoriteChanged,
  });

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

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(clearMessages, 4000);
    return () => clearTimeout(t);
  }, [successMsg, clearMessages]);

  const handleSaveProfile = async () => {
    await saveProfile();
    setIsEditing(false);
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-6xl space-y-5">
      <Banner type="success" message={successMsg} onClose={clearMessages} />
      <Banner type="error" message={error} onClose={clearMessages} />

      <ProfileHeader
        profile={profile}
        completeness={completeness}
        onEdit={() => setIsEditing(true)}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {profile?.role === "GUEST" && (
          <StatCard
            value={favoriteTotal.toLocaleString("ar-EG")}
            label="شقق محفوظة"
          />
        )}
        <StatCard
          value={Number(profile?._count?.listings ?? 0).toLocaleString("ar-EG")}
          label="عقارات منشورة"
        />
        <StatCard
          value={Number(profile?.trustScore ?? 0).toLocaleString("ar-EG")}
          label="نقاط الثقة"
        />
      </div>

      {profile?.role === "GUEST" && (
        <FavoritesPreview
          favorites={visibleFavorites}
          total={favoriteTotal}
          loading={favoritesLoading}
          onFavoriteToggle={toggleFavorite}
          pendingFavoriteIds={pendingIds}
          profileRole={profile?.role}
        />
      )}

      <SectionCard
        title="المعلومات الشخصية"
        action={
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-black text-[#1752F0] hover:text-[#1240c4]"
          >
            تعديل
          </button>
        }
      >
        <AccountInfo profile={profile} />
      </SectionCard>

      <SectionCard title="تفضيلاتي" action={null}>
        {profile?.role === "GUEST" ? (
          <PreferencesSection profile={profile} onSaved={loadProfile} />
        ) : (
          <div className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-600">
            تفضيلات زملاء السكن متاحة فقط لحسابات الطلاب المغتربين.
          </div>
        )}
      </SectionCard>

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

      {profile?.id && (
        <UserReviewsSection userId={profile.id} role={profile.role} />
      )}

      {profile?.passwordHash && (
        <ChangePasswordForm
          loading={passwordLoading}
          onSubmit={changePassword}
        />
      )}

      <EditProfileModal
        open={isEditing}
        onClose={() => setIsEditing(false)}
        profile={profile}
        form={form}
        saving={saving}
        avatarLoading={avatarLoading}
        onChange={updateField}
        onSave={handleSaveProfile}
        onUpload={uploadAvatar}
      />
    </div>
  );
}
