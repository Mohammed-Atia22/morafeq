const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export function StarRatingInput({
  value = 0,
  onChange,
  label,
  size = "md",
  required = true,
}) {
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs font-bold text-slate-600">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </p>
      )}
      <div className="flex items-center gap-1" dir="ltr">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const isActive = starValue <= value;

          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange(starValue)}
              className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1752F0]/30"
              aria-label={`${starValue} من 5`}
            >
              <svg
                viewBox="0 0 20 20"
                fill={isActive ? "#FBBF24" : "none"}
                stroke="#FBBF24"
                strokeWidth="1"
                className={sizeClass}
              >
                <path d={STAR_PATH} />
              </svg>
            </button>
          );
        })}
        {value > 0 && (
          <span className="mr-2 text-xs font-bold text-slate-500">{value}/5</span>
        )}
      </div>
    </div>
  );
}
