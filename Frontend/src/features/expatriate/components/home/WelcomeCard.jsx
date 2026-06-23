import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function WelcomeCard({ firstName, totalListings = 0 }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    navigate(`/expatriate/search?${params.toString()}`);
  };

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-2xl bg-[#1752F0] px-5 py-6 text-white sm:px-8 sm:py-8"
      style={{
        background: "linear-gradient(135deg, #1752F0 0%, #1240c4 60%, #0e35a8 100%)",
      }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-white/5" />

      {/* Top badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        الذكاء الاصطناعي يبحث لك الآن
      </div>

      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black leading-snug sm:text-2xl">
            مرحباً {firstName ?? "بك"} 👋
          </h1>
          <p className="mt-1 text-base font-bold text-white/90 sm:text-lg">
            لنبحث عن سكنك المثالي
          </p>
          {totalListings > 0 && (
            <p className="mt-1 text-sm text-white/70">
              عندنا{" "}
              <span className="font-bold text-white">{totalListings}+</span>{" "}
              وحدة قريبة منك
            </p>
          )}
        </div>

        {/* Graduation cap icon area */}
        <div className="hidden shrink-0 sm:block">
          <div className="flex gap-2">
            {["✅", "📍", "🏠"].map((emoji) => (
              <span
                key={emoji}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg backdrop-blur"
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>



      {/* Stats row */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { value: "96%", label: "نسبة رضا المستأجرين", emoji: "⭐" },
          { value: "18", label: "منطقة متاحة", emoji: "📍" },
          { value: totalListings || "342", label: "عقار متاح", emoji: "🏠" },
        ].map(({ value, label, emoji }) => (
          <div
            key={label}
            className="rounded-xl bg-white/10 px-3 py-2.5 text-center backdrop-blur"
          >
            <div className="text-lg font-black">
              {emoji} {value}
            </div>
            <div className="text-xs text-white/70">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
