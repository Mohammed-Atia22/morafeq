import { RatingSummary } from "./RatingSummary";
import { ReviewList } from "./ReviewList";

export function ReviewsPanel({
  title = "التقييمات",
  averageRating = 0,
  reviewCount = 0,
  reviews = [],
  loading = false,
  error = "",
  currentUserId,
  onDelete,
  deletingReviewId,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  emptyMessage = "لا توجد تقييمات حتى الآن",
  showSummary = true,
  className = "",
}) {
  return (
    <section
      dir="rtl"
      className={`rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#0f172a]">{title}</h2>
        {showSummary && (
          <RatingSummary
            averageRating={averageRating}
            reviewCount={reviewCount}
            size="lg"
          />
        )}
      </div>

      <ReviewList
        reviews={reviews}
        loading={loading}
        error={error}
        emptyMessage={emptyMessage}
        currentUserId={currentUserId}
        onDelete={onDelete}
        deletingReviewId={deletingReviewId}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
      />
    </section>
  );
}
