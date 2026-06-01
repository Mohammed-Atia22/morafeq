const OWNER_FEATURES = [
  "إدارة عقاراتك من مكان واحد",
  "عقود رقمية موثوقة وآمنة",
  "مدفوعات مضمونة وسريعة",
];

const OwnerCTA = () => {
  return (
    <section id="owners" className="py-20 owner-cta-bg relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center gap-12 flex-row-reverse">
          {/* Illustration placeholder */}
          <div className="flex-shrink-0 w-40 h-40 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="text-7xl">🏗️</span>
          </div>

          {/* Content */}
          <div className="text-right flex-1">
            <p className="text-emerald-300 font-bold text-sm mb-3">🏢 للملاك والمستثمرين</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              أضف عقاراتك وتواصل مع
              <br />
              <span className="text-emerald-300">آلاف الطلاب المناسبين</span>
            </h2>

            <ul className="space-y-2 mb-8">
              {OWNER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-emerald-100 font-medium flex-row-reverse">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="inline-flex items-center gap-2 bg-white text-emerald-800 font-black px-7 py-4 rounded-2xl shadow-lg hover:bg-emerald-50 transition-colors active:scale-95 text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              أضف عقارك الآن
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerCTA;