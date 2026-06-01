// src/components/landing/StatsBar.jsx
// UPDATED: removed hardcoded STATS array, now uses useStats hook
import { useStats } from "../../hooks";

// Icon + label config — display only, no numbers here
const STAT_CONFIG = [
  { key: "properties",   label: "عقار موثوق",   icon: "🏠", suffix: "+" },
  { key: "students",     label: "طالب سعيد",    icon: "😊", suffix: "+" },
  { key: "universities", label: "جامعة مغطاة",  icon: "🎓", suffix: "+" },
  { key: "satisfaction", label: "نسبة الرضا",   icon: "⭐", suffix: "%" },
];

// Skeleton shimmer for a single stat
const StatSkeleton = () => (
  <div className="text-center animate-pulse">
    <div className="text-3xl mb-1">　</div>
    <div className="h-8 bg-blue-500/30 rounded-lg w-24 mx-auto mb-1" />
    <div className="h-4 bg-blue-500/20 rounded w-16 mx-auto" />
  </div>
);

const StatsBar = () => {
  const { display, loading } = useStats();

  return (
    <section className="bg-primary-600 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : STAT_CONFIG.map((stat, i) => (
                <div
                  key={stat.key}
                  className="text-center"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="text-3xl mb-1">{stat.icon}</div>
                  <div className="text-3xl font-black text-white stat-number mb-1">
                    {typeof display[stat.key] === "number"
                      ? display[stat.key].toLocaleString()
                      : display[stat.key]}
                    {display[stat.key] !== "..." && stat.suffix}
                  </div>
                  <div className="text-blue-200 text-sm font-semibold">{stat.label}</div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;