import { useParams, Link } from "react-router-dom";
import { useLocationInsight } from "../hooks/useLocationInsight";

// ─── Service icon map ─────────────────────────
const SERVICE_CONFIG = {
  pharmacies: {
    label: "صيدليات",
    icon: "💊",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  supermarkets: {
    label: "سوبرماركت",
    icon: "🛒",
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-200",
  },
  hospitals: {
    label: "مستشفيات وعيادات",
    icon: "🏥",
    color: "from-red-500 to-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
  },
  restaurants: {
    label: "مطاعم",
    icon: "🍽️",
    color: "from-yellow-500 to-yellow-600",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    ring: "ring-yellow-200",
  },
  cafes: {
    label: "كافيهات",
    icon: "☕",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
  },
  transport: {
    label: "وسائل مواصلات",
    icon: "🚌",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
  },
  universities: {
    label: "جامعات ومعاهد",
    icon: "🎓",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200",
  },
  gyms: {
    label: "صالات رياضية",
    icon: "🏋️",
    color: "from-pink-500 to-pink-600",
    bg: "bg-pink-50",
    text: "text-pink-700",
    ring: "ring-pink-200",
  },
};

// ─── Score bar ────────────────────────────────
function ScoreBar({ count, max = 10 }) {
  const pct = Math.min((count / max) * 100, 100);
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#1752F0] to-[#4f7df7] transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Service card ─────────────────────────────
function ServiceCard({ serviceKey, count }) {
  const config = SERVICE_CONFIG[serviceKey];
  if (!config) return null;

  const isEmpty = count === 0;

  return (
    <div
      className={[
        "rounded-2xl p-4 ring-1 transition",
        isEmpty ? "bg-slate-50 ring-slate-100" : `${config.bg} ${config.ring}`,
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{config.icon}</span>
        <span
          className={[
            "text-xl font-black",
            isEmpty ? "text-slate-300" : config.text,
          ].join(" ")}
        >
          {count}
        </span>
      </div>
      <p
        className={[
          "mt-2 text-xs font-bold",
          isEmpty ? "text-slate-400" : config.text,
        ].join(" ")}
      >
        {config.label}
      </p>
      <ScoreBar count={count} />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────
function InsightSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-32 rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-slate-200" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────
export function ExpatriateLocationInsightPage() {
  const { id } = useParams();
  const { insight, loading, error } = useLocationInsight(id);

  const services = insight?.nearbyServices ?? {};
  const advantages = insight?.advantages ?? [];
  const disadvantages = insight?.disadvantages ?? [];
  const radiusKm = insight?.radiusMeters
    ? (insight.radiusMeters / 1000).toFixed(1)
    : "1";

  const generatedAt = insight?.generatedAt
    ? new Date(insight.generatedAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Overall score: average of all services capped at 10 each
  const serviceValues = Object.values(services).filter(
    (v) => typeof v === "number",
  );
  const totalScore =
    serviceValues.length > 0
      ? Math.round(
          (serviceValues.reduce((a, b) => a + Math.min(b, 10), 0) /
            (serviceValues.length * 10)) *
            100,
        )
      : 0;

  const scoreLabel =
    totalScore >= 75
      ? "ممتاز"
      : totalScore >= 50
        ? "جيد"
        : totalScore >= 25
          ? "مقبول"
          : "محدود";

  const scoreColor =
    totalScore >= 75
      ? "text-emerald-600"
      : totalScore >= 50
        ? "text-blue-600"
        : totalScore >= 25
          ? "text-amber-600"
          : "text-red-500";

  return (
    <div dir="rtl" className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link to="/expatriate" className="transition hover:text-[#1752F0]">
          الرئيسية
        </Link>
        <span>/</span>
        <Link
          to={`/expatriate/listings/${id}`}
          className="transition hover:text-[#1752F0]"
        >
          تفاصيل العقار
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-600">تحليل المنطقة</span>
      </nav>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          {/* Loading notice — backend may take time to generate */}
          <div className="flex items-center gap-3 rounded-2xl bg-[#EEF3FF] px-5 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1752F0] border-t-transparent" />
            <p className="text-sm font-semibold text-[#1752F0]">
              جاري تحليل المنطقة بالذكاء الاصطناعي، قد يستغرق بضع ثوانٍ...
            </p>
          </div>
          <InsightSkeleton />
        </div>
      )}

      {/* Content */}
      {!loading && insight && (
        <div className="space-y-5">
          {/* ── Hero score card ───────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#1752F0] to-[#1240c4] px-7 py-7 text-white">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-14 right-1/3 h-56 w-56 rounded-full bg-white/5" />

            <div className="relative flex items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    تحليل بالذكاء الاصطناعي
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-black">تحليل المنطقة</h1>
                <p className="mt-1 text-sm text-white/70">
                  في نطاق {radiusKm} كم من العقار
                </p>
                {generatedAt && (
                  <p className="mt-0.5 text-xs text-white/50">
                    آخر تحديث: {generatedAt}
                  </p>
                )}
              </div>

              {/* Score circle */}
              <div className="shrink-0 text-center">
                <div className="relative grid h-24 w-24 place-items-center rounded-full bg-white/15 ring-4 ring-white/20 backdrop-blur">
                  <div>
                    <p className={`text-3xl font-black ${scoreColor}`}>
                      {totalScore}
                    </p>
                    <p className="text-xs text-white/70">/ 100</p>
                  </div>
                </div>
                <p className="mt-2 text-sm font-bold">{scoreLabel}</p>
              </div>
            </div>
          </div>

          {/* ── Services grid ─────────────────────── */}
          <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-4 text-sm font-black text-[#0f172a]">
              الخدمات المتاحة في المنطقة
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.keys(SERVICE_CONFIG).map((key) => (
                <ServiceCard
                  key={key}
                  serviceKey={key}
                  count={services[key] ?? 0}
                />
              ))}
            </div>
          </div>

          {/* ── Advantages ────────────────────────── */}
          {advantages.length > 0 && (
            <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-emerald-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-sm font-black text-[#0f172a]">
                  مميزات المنطقة
                </h2>
              </div>
              <ul className="space-y-2.5">
                {advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3 w-3 text-emerald-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {adv}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Disadvantages ─────────────────────── */}
          {disadvantages.length > 0 && (
            <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-amber-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-sm font-black text-[#0f172a]">
                  نقاط يجب مراعاتها
                </h2>
              </div>
              <ul className="space-y-2.5">
                {disadvantages.map((dis, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-100">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3 w-3 text-amber-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {dis}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Disclaimer ────────────────────────── */}
          <div className="rounded-xl bg-slate-50 px-5 py-3 ring-1 ring-slate-100">
            <p className="text-xs leading-relaxed text-slate-400">
              ⚠️ هذا التحليل مبني على بيانات OpenStreetMap في نطاق {radiusKm} كم
              من العقار. البيانات قد لا تكون شاملة لجميع الخدمات المتاحة في
              المنطقة.
            </p>
          </div>

          {/* ── Back button ───────────────────────── */}
          <Link
            to={`/expatriate/listings/${id}`}
            className="flex items-center gap-2 text-sm font-bold text-[#1752F0] transition hover:text-[#1240c4]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            العودة لتفاصيل العقار
          </Link>
        </div>
      )}
    </div>
  );
}
