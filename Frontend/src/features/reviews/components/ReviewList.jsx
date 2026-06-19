import { ReviewCard } from "./ReviewCard";

function ReviewListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewList({
  reviews = [],
  loading = false,
  error = "",
  emptyMessage = "لا توجد تقييمات حتى الآن",
  currentUserId,
  onDelete,
  deletingReviewId,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  if (loading) {
    return <ReviewListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-4xl" aria-hidden="true">
          💬
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          onDelete={onDelete}
          deleting={deletingReviewId === review.id}
        />
      ))}

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-bold text-slate-600 transition hover:border-[#1752F0] hover:text-[#1752F0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "جاري التحميل..." : "عرض المزيد"}
          </button>
        </div>
      )}
    </div>
  );
}
