import { useCallback } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDeleteReview } from "../hooks/useDeleteReview";
import { useHostReviews } from "../hooks/useHostReviews";
import { useGuestReviews } from "../hooks/useGuestReviews";
import { ReviewsPanel } from "./ReviewsPanel";

export function UserReviewsSection({ userId, role }) {
  const { user } = useAuth();
  const isHost = role === "HOST";
  const isGuest = role === "GUEST";

  const hostState = useHostReviews(isHost ? userId : null);
  const guestState = useGuestReviews(isGuest ? userId : null);

  if (!isHost && !isGuest) {
    return null;
  }

  const {
    reviews,
    meta,
    loading,
    loadingMore,
    error,
    loadMore,
    hasMore,
    refetch,
  } = isHost ? hostState : guestState;

  const { deleteReview, deletingReviewId } = useDeleteReview({
    onDeleted: () => refetch(),
  });

  const handleDelete = useCallback(
    async (reviewId) => {
      await deleteReview(reviewId);
    },
    [deleteReview],
  );

  return (
    <ReviewsPanel
      averageRating={meta.averageRating ?? 0}
      reviewCount={meta.total ?? 0}
      reviews={reviews}
      loading={loading}
      error={error}
      currentUserId={user?.id}
      onDelete={handleDelete}
      deletingReviewId={deletingReviewId}
      onLoadMore={loadMore}
      hasMore={hasMore}
      loadingMore={loadingMore}
    />
  );
}
