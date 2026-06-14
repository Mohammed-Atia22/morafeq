// Country codes for the phone field
const COUNTRY_CODES = [
  { code: "EG", dialCode: "+20",  label: "🇪🇬 مصر" },
  { code: "SA", dialCode: "+966", label: "🇸🇦 السعودية" },
  { code: "AE", dialCode: "+971", label: "🇦🇪 الإمارات" },
  { code: "KW", dialCode: "+965", label: "🇰🇼 الكويت" },
  { code: "QA", dialCode: "+974", label: "🇶🇦 قطر" },
  { code: "BH", dialCode: "+973", label: "🇧🇭 البحرين" },
  { code: "OM", dialCode: "+968", label: "🇴🇲 عُمان" },
  { code: "JO", dialCode: "+962", label: "🇯🇴 الأردن" },
  { code: "LB", dialCode: "+961", label: "🇱🇧 لبنان" },
  { code: "SY", dialCode: "+963", label: "🇸🇾 سوريا" },
  { code: "IQ", dialCode: "+964", label: "🇮🇶 العراق" },
  { code: "LY", dialCode: "+218", label: "🇱🇾 ليبيا" },
  { code: "TN", dialCode: "+216", label: "🇹🇳 تونس" },
  { code: "DZ", dialCode: "+213", label: "🇩🇿 الجزائر" },
  { code: "MA", dialCode: "+212", label: "🇲🇦 المغرب" },
  { code: "SD", dialCode: "+249", label: "🇸🇩 السودان" },
];

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-xs font-bold text-slate-600">
      {children}
      {required && <span className="mr-1 text-red-400">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text", dir = "rtl" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
    />
  );
}

export function ProfileInfoForm({ form, onChange }) {
  if (!form) return null;

  const handleCountryCodeChange = (dialCode) => {
    const found = COUNTRY_CODES.find((c) => c.dialCode === dialCode);
    onChange("phoneCountryCode", dialCode);
    onChange("phoneCountry", found?.code ?? "");
  };

  return (
    <div dir="rtl" className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="mb-5 text-sm font-black text-[#0f172a]">المعلومات الشخصية</h2>

      <div className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>الاسم الأول</FieldLabel>
            <Input
              value={form.firstName}
              onChange={(v) => onChange("firstName", v)}
              placeholder="مثال: محمد"
            />
          </div>
          <div>
            <FieldLabel required>الاسم الأخير</FieldLabel>
            <Input
              value={form.lastName}
              onChange={(v) => onChange("lastName", v)}
              placeholder="مثال: أحمد"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <FieldLabel>الجنس</FieldLabel>
          <div className="flex gap-3">
            {[
              { value: "male",   label: "ذكر",  emoji: "👨" },
              { value: "female", label: "أنثى", emoji: "👩" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange("gender", opt.value)}
                className={[
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition",
                  form.gender === opt.value
                    ? "border-[#1752F0] bg-[#EEF3FF] text-[#1752F0]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div>
          <FieldLabel>رقم الهاتف</FieldLabel>
          <div className="flex gap-2">
            {/* Country code selector */}
            <select
              value={form.phoneCountryCode || "+20"}
              onChange={(e) => handleCountryCodeChange(e.target.value)}
              dir="rtl"
              className="w-36 shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.dialCode}>
                  {c.label} ({c.dialCode})
                </option>
              ))}
            </select>
            {/* Number input */}
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="01XXXXXXXXX"
              dir="ltr"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            />
          </div>
          {/* Google user nudge */}
          {!form.phone && (
            <p className="mt-1.5 text-xs text-amber-600">
              ⚠️ رقم الهاتف مفقود — أضفه لتحسين تجربتك
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <FieldLabel>نبذة شخصية</FieldLabel>
          <textarea
            value={form.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            placeholder="اكتب نبذة مختصرة عن نفسك..."
            rows={3}
            dir="rtl"
            maxLength={500}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {form.bio?.length ?? 0} / 500
          </p>
        </div>
      </div>
    </div>
  );
}