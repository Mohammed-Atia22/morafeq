import { useEffect, useState } from "react";
import { StarRatingInput } from "./StarRatingInput";
import { useCreateReview } from "../hooks/useCreateReview";
import {
  LISTING_SUB_RATING_LABELS,
  REVIEW_TYPE_LABELS,
} from "../utils/reviewConstants";

const INITIAL_LISTING_RATINGS = {
  rating: 0,
  cleanliness: 0,
  location: 0,
  accuracy: 0,
  value: 0,
};

export function ReviewFormDialog({
  open,
  onClose,
  bookingId,
  reviewType,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [subRatings, setSubRatings] = useState(INITIAL_LISTING_RATINGS);
  const [comment, setComment] = useState("");

  const { createReview, submitting } = useCreateReview({
    onSuccess: () => {
      onSubmitted?.();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    setRating(0);
    setSubRatings(INITIAL_LISTING_RATINGS);
    setComment("");
  }, [open, reviewType, bookingId]);

  if (!open || !reviewType) return null;

  const isListingReview = reviewType === "GUEST_TO_LISTING";
  const title = REVIEW_TYPE_LABELS[reviewType] ?? "إضافة تقييم";

  const updateSubRating = (field, value) => {
    setSubRatings((current) => ({ ...current, [field]: value }));
  };

  const isValid = () => {
    if (isListingReview) {
      return (
        subRatings.cleanliness > 0 &&
        subRatings.location > 0 &&
        subRatings.accuracy > 0 &&
        subRatings.value > 0 &&
        rating > 0
      );
    }

    return rating > 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid()) return;

    const payload = {
      bookingId,
      type: reviewType,
      rating,
      comment: comment.trim() || undefined,
    };

    if (isListingReview) {
      payload.cleanliness = subRatings.cleanliness;
      payload.location = subRatings.location;
      payload.accuracy = subRatings.accuracy;
      payload.value = subRatings.value;
    }

    await createReview(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        dir="rtl"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6"
      >
        <h3 className="text-base font-black text-[#0f172a]">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          شارك تجربتك بصدق لمساعدة المستخدمين الآخرين
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <StarRatingInput
            label="التقييم العام"
            value={rating}
            onChange={setRating}
          />

          {isListingReview && (
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-700">تفاصيل تقييم الشقة</p>
              {Object.entries(LISTING_SUB_RATING_LABELS).map(([field, label]) => (
                <StarRatingInput
                  key={field}
                  label={label}
                  value={subRatings[field]}
                  onChange={(value) => updateSubRating(field, value)}
                  size="sm"
                />
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">
              تعليقك (اختياري)
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="اكتب تجربتك بالتفصيل..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0]"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting || !isValid()}
              className="flex-1 rounded-xl bg-[#1752F0] py-2.5 text-sm font-black text-white transition hover:bg-[#1240c4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
