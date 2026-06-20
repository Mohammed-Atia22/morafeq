import { RatingStars } from "../../../reviews/components/RatingStars";
import { RatingSummary } from "../../../reviews/components/RatingSummary";
import { formatDisputeDate, getSenderDisplayName } from "../../../dispute-chat/utils/disputeMessageUtils";

export function AdminDisputeReviewsList({ reviews = [], title = "التقييمات" }) {
  if (!reviews.length) {
    return (
      <div className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-500">
        لا توجد تقييمات
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-black text-slate-700">{title}</h4>
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-800">
                {getSenderDisplayName(review.reviewer)}
              </p>
              <RatingStars rating={review.rating} size="sm" className="mt-1" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!review.isVisible && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  مخفي
                </span>
              )}
              {review.rating <= 2 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  تقييم منخفض
                </span>
              )}
              <span className="text-[11px] text-slate-400">
                {formatDisputeDate(review.createdAt)}
              </span>
            </div>
          </div>
          {review.listing?.title && (
            <p className="mt-1 text-xs text-slate-500">
              العقار: {review.listing.title}
            </p>
          )}
          {review.comment && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {review.comment}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export function AdminRatingSummaryCard({ summary, title }) {
  if (!summary) return null;

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-700">{title}</p>
      <div className="mt-2">
        <RatingSummary
          averageRating={summary.averageRating ?? 0}
          reviewCount={summary.totalReviews ?? 0}
          size="sm"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <span>تقييمات منخفضة: {summary.lowRatingsCount ?? 0}</span>
        <span>تقييمات مخفية: {summary.hiddenReviewsCount ?? 0}</span>
      </div>
    </div>
  );
}
