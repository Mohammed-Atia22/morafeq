function StarRow({ rating, size = "sm" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < Math.round(rating) ? "#FBBF24" : "none"}
          stroke="#FBBF24"
          strokeWidth="1"
          className={sizeClass}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const name = review.reviewer
    ? `${review.reviewer.firstName ?? ""} ${review.reviewer.lastName ?? ""}`.trim()
    : "مجهول";

  const initials = review.reviewer?.firstName?.charAt(0)?.toUpperCase() ?? "م";

  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {review.reviewer?.avatarUrl ? (
          <img
            src={review.reviewer.avatarUrl}
            alt={name}
            className="h-9 w-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EEF3FF] text-sm font-bold text-[#1752F0]">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#0f172a]">{name}</p>
            {date && <p className="text-xs text-slate-400 shrink-0">{date}</p>}
          </div>
          <StarRow rating={review.rating} />
          {review.comment && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewsSection({ reviews = [], averageRating = 0, reviewCount = 0 }) {
  return (
    <div dir="rtl" className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-black text-[#0f172a]">التقييمات</h2>

        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRow rating={averageRating} size="lg" />
            <span className="text-sm font-black text-[#0f172a]">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">({reviewCount} تقييم)</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-4xl">💬</span>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            لا توجد تقييمات بعد
          </p>
          <p className="mt-1 text-xs text-slate-400">
            كن أول من يقيّم هذا العقار بعد إقامتك
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}