import { useNavigate } from "react-router-dom";

export function LocationInsightButton({ listingId }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/expatriate/listings/${listingId}/insights`)}
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7"
            />
          </svg>
        </div>

        <div dir="rtl" className="text-right">
          <p className="text-sm font-black">تحليل المنطقه</p>
          <p className="text-xs text-white/70">
            صيدليات · مواصلات · مستشفيات · جامعات وأكثر
          </p>
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
