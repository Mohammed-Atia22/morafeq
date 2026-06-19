import { useState } from "react";
import { useCanReview } from "../hooks/useCanReview";
import { ReviewFormDialog } from "./ReviewFormDialog";
import { REVIEW_TYPE_LABELS } from "../utils/reviewConstants";

export function BookingReviewActions({
  bookingId,
  bookingStatus,
  onReviewSubmitted,
  compact = false,
}) {
  const enabled = bookingStatus === "COMPLETED";
  const { eligibility, loading, refetch } = useCanReview(bookingId, enabled);
  const [activeReviewType, setActiveReviewType] = useState(null);

  if (!enabled) return null;

  if (loading) {
    return (
      <div className={`text-xs font-semibold text-slate-400 ${compact ? "py-1" : "py-2"}`}>
        جاري التحقق من التقييمات...
      </div>
    );
  }

  const availableReviews =
    eligibility?.availableReviews?.filter((item) => item.canReview) ?? [];

  if (!eligibility?.canReview || availableReviews.length === 0) {
    return (
      <div className={`text-center text-xs font-bold text-slate-400 ${compact ? "py-1" : "py-1.5"}`}>
        {eligibility?.availableReviews?.some((item) => item.alreadyReviewed)
          ? "تم إرسال جميع التقييمات المتاحة"
          : "لا توجد تقييمات متاحة لهذا الحجز"}
      </div>
    );
  }

  const handleSubmitted = () => {
    setActiveReviewType(null);
    refetch();
    onReviewSubmitted?.();
  };

  return (
    <>
      <div className={`flex flex-col gap-2 ${compact ? "" : "w-full"}`}>
        {availableReviews.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => setActiveReviewType(item.type)}
            className="w-full rounded-xl bg-[#1752F0] py-2.5 text-xs font-black text-white transition hover:bg-[#1240c4]"
          >
            {REVIEW_TYPE_LABELS[item.type] ?? item.title}
          </button>
        ))}
      </div>

      <ReviewFormDialog
        open={Boolean(activeReviewType)}
        onClose={() => setActiveReviewType(null)}
        bookingId={bookingId}
        reviewType={activeReviewType}
        onSubmitted={handleSubmitted}
      />
    </>
  );
}
