import { Link, useParams } from "react-router-dom";
import { useCallback } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePublicProfile } from "../hooks/usePublicProfile";
import {
  PublicProfileHeader,
  PublicProfileSkeletonWrapper,
} from "../components/PublicProfileHeader";
import { useGuestReviews } from "../../reviews/hooks/useGuestReviews";
import { useDeleteReview } from "../../reviews/hooks/useDeleteReview";
import { ReviewsPanel } from "../../reviews/components/ReviewsPanel";

export function PublicGuestProfilePage() {
  const { guestId } = useParams();
  const { user } = useAuth();

  // Guard: show error if guestId is missing
  if (!guestId) {
    return (
      <div dir="rtl" className="mx-auto max-w-3xl">
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
          معرف المستأجر مفقود. يرجى التأكد من الرابط.
        </div>
        <Link
          to="/expatriate"
          className="mt-4 inline-block text-sm font-bold text-[#1752F0]"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = usePublicProfile(guestId);

  const {
    reviews,
    meta,
    loading: reviewsLoading,
    loadingMore,
    error: reviewsError,
    loadMore,
    hasMore,
    refetch,
  } = useGuestReviews(guestId);

  const { deleteReview, deletingReviewId } = useDeleteReview({
    onDeleted: () => refetch(),
  });

  const handleDelete = useCallback(
    async (reviewId) => {
      await deleteReview(reviewId);
    },
    [deleteReview],
  );

  if (profileLoading) {
    return (
      <div dir="rtl" className="mx-auto max-w-3xl space-y-4">
        <PublicProfileSkeletonWrapper />
      </div>
    );
  }

  if (profileError) {
    return (
      <div dir="rtl" className="mx-auto max-w-3xl">
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
          {profileError}
        </div>
        <Link
          to="/expatriate"
          className="mt-4 inline-block text-sm font-bold text-[#1752F0]"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-5">
      <nav className="text-xs text-slate-400">
        <Link
          to="/owner/rental-requests"
          className="transition hover:text-[#1752F0]"
        >
          طلبات الإيجار
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-semibold text-slate-600">ملف المستأجر</span>
      </nav>

      <PublicProfileHeader
        profile={profile}
        averageRating={meta.averageRating ?? 0}
        reviewCount={meta.total ?? 0}
        loadingRating={reviewsLoading}
      />

      <ReviewsPanel
        showSummary={false}
        averageRating={meta.averageRating ?? 0}
        reviewCount={meta.total ?? 0}
        reviews={reviews}
        loading={reviewsLoading}
        error={reviewsError}
        currentUserId={user?.id}
        onDelete={handleDelete}
        deletingReviewId={deletingReviewId}
        onLoadMore={loadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
      />
    </div>
  );
}
