const QUICK_TAGS = [
  { label: "الأكثر طلباً 🔥", active: true },
  { label: "مؤثثة فقط 🛋️", active: false },
  { label: "سكن إناث 👩", active: false },
  { label: "أقل من 2000 ج.م 💰", active: false },
  { label: "أضف عقارك 🏠", active: false },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80')`,
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-700/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold px-5 py-2 rounded-full mb-8 animate-fade-in">
          <span>🏆</span>
          <span>المنصة الأولى للسكن الطلابي في مصر</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 fade-in-up">
          اعثر على سكنك المثالي
          <br />
          <span className="gradient-text">بالقرب من جامعتك</span>
        </h1>

        <p className="text-blue-100 text-lg sm:text-xl font-medium mb-10 max-w-2xl mx-auto opacity-90">
          آلاف العقارات الموثوقة بالقرب من أكبر الجامعات – ابحث، قارن، واسكن بأمان
        </p>

        {/* Search bar */}
        <div className="bg-white rounded-2xl shadow-hero overflow-hidden mb-6 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-stretch">
            {/* University select */}
            <div className="flex-1 border-b sm:border-b-0 sm:border-l border-gray-100">
              <label className="block text-right text-xs text-gray-400 font-semibold px-4 pt-3 pb-0">الجامعة</label>
              <select className="search-select w-full text-right pb-2">
                <option value="">اختر جامعتك</option>
                <option>جامعة القاهرة</option>
                <option>جامعة عين شمس</option>
                <option>جامعة الأزهر</option>
                <option>جامعة حلوان</option>
                <option>الجامعة الأمريكية</option>
              </select>
            </div>

            {/* Area select */}
            <div className="flex-1 border-b sm:border-b-0 sm:border-l border-gray-100">
              <label className="block text-right text-xs text-gray-400 font-semibold px-4 pt-3 pb-0">المنطقة</label>
              <select className="search-select w-full text-right pb-2">
                <option value="">أي منطقة</option>
                <option>المهندسين</option>
                <option>مدينة نصر</option>
                <option>الدقي</option>
                <option>شبرا</option>
                <option>الزيتون</option>
              </select>
            </div>

            {/* Budget select */}
            <div className="flex-1 border-b sm:border-b-0 sm:border-l border-gray-100">
              <label className="block text-right text-xs text-gray-400 font-semibold px-4 pt-3 pb-0">الميزانية الشهرية</label>
              <select className="search-select w-full text-right pb-2">
                <option value="">أي ميزانية</option>
                <option>أقل من 1,500 ج.م</option>
                <option>1,500 – 2,500 ج.م</option>
                <option>2,500 – 4,000 ج.م</option>
                <option>أكثر من 4,000 ج.م</option>
              </select>
            </div>

            {/* Search button */}
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 text-base transition-colors duration-150 flex items-center justify-center gap-2 whitespace-nowrap">
              <span>ابحث الآن</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.label}
              className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-150 ${
                tag.active
                  ? "bg-white text-primary-700 border-white shadow-md"
                  : "bg-white/15 text-white border-white/30 hover:bg-white/25 backdrop-blur-sm"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;