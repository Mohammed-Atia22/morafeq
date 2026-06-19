import { VerificationBadge } from "../../verification/components/VerificationBadge";
import { RatingSummary } from "../../reviews/components/RatingSummary";
import { getReviewerDisplayName, getReviewerInitials } from "../../reviews/utils/reviewHelpers";

export function PublicProfileHeader({
  profile,
  averageRating = 0,
  reviewCount = 0,
  loadingRating = false,
  showVerification = false,
}) {
  if (!profile) return null;

  const fullName = getReviewerDisplayName(profile);
  const initials = getReviewerInitials(profile);

  return (
    <div
      dir="rtl"
      className="rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-right">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={fullName}
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
          />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#1752F0] text-2xl font-bold text-white">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-xl font-black text-[#0f172a]">{fullName}</h1>
            {showVerification && (
              <VerificationBadge status={profile.verificationStatus} compact />
            )}
          </div>

          <div className="mt-3 flex justify-center sm:justify-start">
            {loadingRating ? (
              <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            ) : (
              <RatingSummary
                averageRating={averageRating}
                reviewCount={reviewCount}
                size="md"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-36 rounded-2xl bg-slate-200" />
      <div className="h-64 rounded-2xl bg-slate-200" />
    </div>
  );
}

export function PublicProfileSkeletonWrapper() {
  return <PublicProfileSkeleton />;
}
