const STEPS = [
  {
    number: "١",
    step: 1,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "ابحث عن سكنك",
    description: "فلتر حسب جامعتك، ميزانيتك وتفضيلاتك – آلاف العقارات الموثوقة في مكان واحد",
  },
  {
    number: "٢",
    step: 2,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "اطلب معاينة",
    description: "تواصل مع المالك مباشرة واطلب موعد للمعاينة – كل شيء بسهولة من التطبيق",
  },
  {
    number: "٣",
    step: 3,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: "سكن وأطمن",
    description: "وقّع عقدك الرقمي، ادفع بأمان، وابدأ حياتك الجامعية بدون قلق",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-primary-600 font-bold text-sm mb-2">⚡ بسيط وسريع</p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            كيف يعمل <span className="text-primary-600">مرافق</span>؟
          </h2>
          <p className="text-gray-500 font-medium">3 خطوات فقط وسكنك في انتظارك</p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-blue-100 via-primary-400 to-blue-100" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.step}
                className="flex flex-col items-center text-center"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {/* Icon circle */}
                <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform hover:scale-105 ${
                  step.step === 2
                    ? "bg-primary-600 text-white shadow-blue-400/40"
                    : "bg-blue-50 text-primary-600 shadow-blue-100"
                }`}>
                  {step.icon}
                  {/* Step number badge */}
                  <span className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                    step.step === 2 ? "bg-amber-400 text-amber-900" : "bg-primary-600 text-white"
                  }`}>
                    {step.step}
                  </span>
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-sm max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <button className="btn-primary text-base px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            ابدأ مجاناً الآن
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;