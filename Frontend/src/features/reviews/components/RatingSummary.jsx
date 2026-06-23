import { RatingStars } from "./RatingStars";
import { formatReviewCount } from "../utils/reviewHelpers";

export function RatingSummary({
  averageRating = 0,
  reviewCount = 0,
  size = "xs",
  showCount = true,
  showNumeric = true,
  className = "",
  align = "start",
}) {
  const hasReviews = reviewCount > 0;
  const numericRating = hasReviews ? Number(averageRating).toFixed(1) : null;
  const alignClass =
    align === "center"
      ? "items-center justify-center"
      : align === "end"
        ? "items-end justify-end"
        : "items-center";

  if (!hasReviews) {
    return (
      <div className={`flex flex-wrap gap-2 text-xs text-slate-400 ${alignClass} ${className}`}>
        <span>لا توجد تقييمات</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${alignClass} ${className}`}>
      <RatingStars rating={averageRating} size={size} />
      {showNumeric && (
        <span className="text-sm font-black text-[#0f172a]">{numericRating}</span>
      )}
      {showCount && (
        <span className="text-xs text-slate-400">{formatReviewCount(reviewCount)}</span>
      )}
    </div>
  );
}
