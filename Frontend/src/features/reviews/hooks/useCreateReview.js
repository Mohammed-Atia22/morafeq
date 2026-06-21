import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { reviewsApi } from "../services/reviewsApi";

export function useCreateReview({ onSuccess } = {}) {
  const [submitting, setSubmitting] = useState(false);

  const createReview = useCallback(
    async (payload) => {
      setSubmitting(true);

      try {
        const review = await reviewsApi.createReview(payload);
        toast.success("تم إرسال التقييم بنجاح");
        onSuccess?.(review);
        return review;
      } catch (err) {
        toast.error(err.message || "تعذر إرسال التقييم");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccess],
  );

  return { createReview, submitting };
}
