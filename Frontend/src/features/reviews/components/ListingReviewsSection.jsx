import { useCallback } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDeleteReview } from "../hooks/useDeleteReview";
import { useListingReviews } from "../hooks/useListingReviews";
import { ReviewsPanel } from "./ReviewsPanel";

export function ListingReviewsSection({ listingId }) {
  const { user } = useAuth();
  const {
    reviews,
    meta,
    loading,
    loadingMore,
    error,
    loadMore,
    hasMore,
    refetch,
  } = useListingReviews(listingId);

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
