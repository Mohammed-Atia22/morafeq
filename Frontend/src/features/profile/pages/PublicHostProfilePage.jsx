import { Link, useParams } from "react-router-dom";
import { useCallback } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePublicProfile } from "../hooks/usePublicProfile";
import {
  PublicProfileHeader,
  PublicProfileSkeletonWrapper,
} from "../components/PublicProfileHeader";
import { useHostReviews } from "../../reviews/hooks/useHostReviews";
import { useDeleteReview } from "../../reviews/hooks/useDeleteReview";
import { ReviewsPanel } from "../../reviews/components/ReviewsPanel";

export function PublicHostProfilePage() {
  const { hostId } = useParams();
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } =
    usePublicProfile(hostId);

  const {
    reviews,
    meta,
    loading: reviewsLoading,
    loadingMore,
    error: reviewsError,
    loadMore,
    hasMore,
    refetch,
  } = useHostReviews(hostId);

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
        <Link to="/expatriate" className="transition hover:text-[#1752F0]">
          الرئيسية
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-semibold text-slate-600">ملف صاحب السكن</span>
      </nav>

      <PublicProfileHeader
        profile={profile}
        averageRating={meta.averageRating ?? 0}
        reviewCount={meta.total ?? 0}
        loadingRating={reviewsLoading}
        showVerification
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
