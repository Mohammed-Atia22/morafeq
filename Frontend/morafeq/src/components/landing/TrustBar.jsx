const TRUST_ITEMS = [
  { icon: "✅", label: "عقارات موثوقة" },
  { icon: "💳", label: "رفع أمن %100" },
  { icon: "🤖", label: "نكاء اصطناعي" },
  { icon: "📞", label: "دعم 24/7" },
];

const TrustBar = () => {
  return (
    <section className="trust-bar border-t border-b border-blue-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center justify-center gap-2">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-gray-700 font-bold text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;