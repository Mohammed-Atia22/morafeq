import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { reviewsApi } from "../services/reviewsApi";

export function useDeleteReview({ onDeleted } = {}) {
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const deleteReview = useCallback(
    async (reviewId) => {
      setDeletingReviewId(reviewId);

      try {
        await reviewsApi.deleteReview(reviewId);
        toast.success("تم حذف التقييم");
        onDeleted?.(reviewId);
      } catch (err) {
        toast.error(err.message || "تعذر حذف التقييم");
        throw err;
      } finally {
        setDeletingReviewId(null);
      }
    },
    [onDeleted],
  );

  return { deleteReview, deletingReviewId };
}
