import { useNavigate } from "react-router-dom";

export function CurrentTenantsSummaryButton({ listingId, tenantCount, averageCompatibility }) {
  const navigate = useNavigate();

  const getCompatibilityText = () => {
    if (averageCompatibility === null || averageCompatibility === undefined) {
      return null;
    }
    return `متوسط التوافق: ${averageCompatibility}%`;
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/expatriate/listings/${listingId}/current-tenants`)}
      className="group flex w-full items-center justify-between rounded-2xl bg-gradient-to-l from-[#1752F0] to-[#1240c4] px-5 py-4 text-white shadow-md transition hover:shadow-lg hover:from-[#1240c4] hover:to-[#0e35a8]"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>

        <div dir="rtl" className="text-right">
          <p className="text-sm font-black">السكان الحاليون</p>
          <p className="text-xs text-white/70">
            تعرف على المستأجرين الحاليين ونسبة التوافق معهم قبل الحجز.
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
            <span>{tenantCount} مستأجر</span>
            {getCompatibilityText() && (
              <>
                <span>·</span>
                <span>{getCompatibilityText()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="h-4 w-4 shrink-0 text-white/70 transition group-hover:translate-x-[-3px]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
}
