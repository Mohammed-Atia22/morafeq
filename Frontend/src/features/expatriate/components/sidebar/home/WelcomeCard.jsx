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
      className="relative overflow-hidden rounded-2xl bg-[#1752F0] px-8 py-8 text-white"
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black leading-snug">
            مرحباً {firstName ?? "بك"} 👋
          </h1>
          <p className="mt-1 text-lg font-bold text-white/90">
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

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#1752F0] shadow transition hover:bg-slate-50"
        >
          ابحث الآن
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="منطقة، جامعة أو نوع السكن..."
            dir="rtl"
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-sm text-white placeholder:text-white/60 backdrop-blur outline-none focus:bg-white/25 focus:ring-2 focus:ring-white/40"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
      </form>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
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