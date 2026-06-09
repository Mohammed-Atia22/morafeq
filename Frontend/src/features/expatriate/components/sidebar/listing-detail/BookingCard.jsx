import { useState } from "react";

export function BookingCard({ monthlyRent, depositAmount, currency = "EGP", listingId }) {
  const [checkIn, setCheckIn] = useState("");
  const [months, setMonths] = useState(1);

  const total = Number(monthlyRent) * months;
  const deposit = Number(depositAmount ?? 0);

  const currencyLabel = currency === "EGP" ? "ج.م" : currency;

  return (
    <div
      dir="rtl"
      className="sticky top-6 rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-100"
    >
      {/* AI badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-bold text-[#1752F0]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1752F0] animate-pulse" />
        تحليل بالذكاء الاصطناعي
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-[#0f172a]">
          {Number(monthlyRent).toLocaleString("ar-EG")}
        </span>
        <span className="text-sm text-slate-400">{currencyLabel} / شهر</span>
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-slate-100" />

      {/* Date input */}
      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-bold text-slate-600">
          تاريخ الدخول
        </label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
        />
      </div>

      {/* Duration */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-bold text-slate-600">
          مدة الإقامة
        </label>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          dir="rtl"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
        >
          {[1, 2, 3, 6, 9, 12].map((m) => (
            <option key={m} value={m}>
              {m} {m === 1 ? "شهر" : "أشهر"} — أدنى إقامة {m} شهر
            </option>
          ))}
        </select>
      </div>

      {/* Price breakdown */}
      <div className="mb-4 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>
            {Number(monthlyRent).toLocaleString("ar-EG")} × {months} شهر
          </span>
          <span className="font-semibold">{total.toLocaleString("ar-EG")} {currencyLabel}</span>
        </div>
        {deposit > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>تأمين</span>
            <span className="font-semibold">{deposit.toLocaleString("ar-EG")} {currencyLabel}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-[#0f172a]">
          <span>الإجمالي</span>
          <span className="text-[#1752F0]">
            {(total + deposit).toLocaleString("ar-EG")} {currencyLabel}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          type="button"
          className="w-full rounded-xl border border-[#1752F0] px-4 py-2.5 text-sm font-bold text-[#1752F0] transition hover:bg-[#EEF3FF]"
        >
          طلب معاينة
        </button>
        <button
          type="button"
          className="w-full rounded-xl bg-[#1752F0] px-4 py-3 text-sm font-black text-white shadow transition hover:bg-[#1240c4]"
        >
          احجز الآن
        </button>
      </div>

      <p className="mt-3 text-center text-[10px] text-slate-400">
        لن يتم خصم أي مبلغ الآن — سيتم التأكيد مع المالك أولاً
      </p>
    </div>
  );
}