const SIZE_CLASSES = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

function SingleStar({ fillPercent, sizeClass }) {
  const clampedFill = Math.min(100, Math.max(0, fillPercent));

  return (
    <span className={`relative inline-block shrink-0 ${sizeClass}`}>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="#FBBF24"
        strokeWidth="1"
        className="h-full w-full"
        aria-hidden="true"
      >
        <path d={STAR_PATH} />
      </svg>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${clampedFill}%` }}
      >
        <svg viewBox="0 0 20 20" fill="#FBBF24" className="h-full w-full" aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}

export function RatingStars({
  rating = 0,
  size = "sm",
  className = "",
  ariaLabel,
}) {
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm;
  const normalizedRating = Math.min(5, Math.max(0, Number(rating) || 0));

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      dir="ltr"
      aria-label={ariaLabel ?? `التقييم ${normalizedRating.toFixed(1)} من 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const fillPercent = Math.min(100, Math.max(0, (normalizedRating - index) * 100));
        return <SingleStar key={index} fillPercent={fillPercent} sizeClass={sizeClass} />;
      })}
    </div>
  );
}
