import { useState, useEffect } from "react";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useBooking } from "../../../bookings/hooks/useBooking";
import { usePayment } from "../../../payments/hooks/usePayment";
import { VerificationRequiredModal } from "../../../verification/components/VerificationRequiredModal";

const getReservationExpiry = (booking) => {
  const approvedAt = booking?.approvedAt || booking?.acceptedAt;
  if (!approvedAt) return null;
  return new Date(new Date(approvedAt).getTime() + 24 * 60 * 60 * 1000);
};

const formatRemainingTime = (expiresAt, now) => {
  if (!expiresAt) return null;
  const remainingMs = expiresAt.getTime() - now;
  if (remainingMs <= 0) return "انتهت المهلة";

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} دقيقة`;
  return `${hours} ساعة و ${minutes} دقيقة`;
};

export function BookingCard({ monthlyRent, depositAmount, currency = "EGP", listingId, listingStatus }) {
  const { user, refreshUser } = useAuth();
  const [checkIn, setCheckIn] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Problem Modal state
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemReason, setProblemReason] = useState("");
  const [problemDescription, setProblemDescription] = useState("");

  // Reusable hooks
  const {
    bookings,
    loading: bookingLoading,
    fetchBookings,
    createBooking,
    confirmReceipt,
    reportProblem,
  } = useBooking();

  const {
    loading: paymentLoading,
    iframeUrl,
    setIframeUrl,
    createPaymentSession,
    startPolling,
    stopPolling,
  } = usePayment();

  // Load current bookings
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Find the active booking for this listing
  const currentBooking = bookings.find(
    (b) =>
      b.listingId === Number(listingId) &&
      !["CANCELLED_BY_GUEST", "CANCELLED_BY_HOST", "CANCELED"].includes(b.status)
  );

  const total = Number(monthlyRent);
  const deposit = Number(depositAmount ?? 0);
  const currencyLabel = currency === "EGP" ? "ج.م" : currency;

  // Handle booking creation
  const handleBooking = async () => {
    const currentUser = (await refreshUser?.()) ?? user;

    if (currentUser?.verificationStatus !== "APPROVED") {
      setShowVerificationModal(true);
      return;
    }

    try {
      await createBooking(Number(listingId), checkIn || undefined, guestMessage || undefined);
      setCheckIn("");
      setGuestMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  // Handle payment triggers
  const handlePayment = async () => {
    if (!currentBooking) return;
    try {
      const session = await createPaymentSession(currentBooking.id);
      if (session?.iframeUrl) {
        // Start polling backend status every 3 seconds to auto-close modal on payment success
        startPolling(currentBooking.id, () => {
          fetchBookings();
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle dispute submission
  const handleReportProblem = async (e) => {
    e.preventDefault();
    if (!problemReason.trim()) return;
    try {
      await reportProblem(currentBooking.id, problemReason, problemDescription);
      setShowProblemModal(false);
      setProblemReason("");
      setProblemDescription("");
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  // Clean polling up when payment modal closes
  const handleClosePayment = () => {
    setIframeUrl(null);
    stopPolling();
    fetchBookings();
  };

  // Render buttons and badges depending on currentBooking state
  const renderBookingState = () => {
    if (!currentBooking) {
      if (listingStatus === "RESERVED") {
        return (
          <div className="space-y-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-blue-800">
              <p className="text-sm font-extrabold">هذا العقار محجوز حاليا</p>
              <p className="mt-1 text-xs font-semibold text-blue-600">
                العقار بانتظار إتمام الدفع من مستأجر آخر. إذا انتهت المهلة بدون دفع سيصبح متاحا مرة أخرى.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-slate-100 py-3 text-sm font-black text-slate-400 cursor-not-allowed"
            >
              غير متاح للحجز الآن
            </button>
          </div>
        );
      }

      // Normal state: Book Now
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600">تاريخ الدخول</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600">رسالة للمالك (اختياري)</label>
            <textarea
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              placeholder="اكتب رسالة تعريفية للمالك هنا..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            />
          </div>
          <button
            type="button"
            onClick={handleBooking}
            disabled={bookingLoading}
            className="w-full rounded-xl bg-[#1752F0] py-3 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60 cursor-pointer"
          >
            {bookingLoading ? "جاري الإرسال..." : "طلب حجز الآن"}
          </button>
        </div>
      );
    }

    const { status, hostResponseNote, rejectionReason } = currentBooking;

    switch (status) {
      case "PENDING_HOST_APPROVAL":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-100 p-4 text-center text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-sm font-extrabold">انتظار موافقة المالك</span>
            </div>
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-amber-200 py-3 text-sm font-black text-amber-700 cursor-not-allowed opacity-80"
            >
              تم إرسال الطلب
            </button>
            <p className="text-center text-[10px] text-slate-400">
              يرجى الانتظار حتى يقوم المالك بقبول أو رفض طلبك.
            </p>
          </div>
        );

      case "REJECTED":
        return (
          <div className="space-y-3">
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-800">
              <p className="text-sm font-extrabold">تم رفض طلبك</p>
              {rejectionReason && (
                <p className="mt-1 text-xs text-red-600 font-semibold">
                  السبب: {rejectionReason}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleBooking}
              disabled={bookingLoading}
              className="w-full rounded-xl bg-[#1752F0] py-3 text-sm font-black text-white shadow transition hover:bg-[#1240c4]"
            >
              تقديم طلب حجز جديد
            </button>
          </div>
        );

      case "PENDING_PAYMENT":
        const expiresAt = getReservationExpiry(currentBooking);
        const remainingTime = formatRemainingTime(expiresAt, now);

        return (
          <div className="space-y-3">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-blue-800 text-center">
              <p className="text-sm font-extrabold">تمت الموافقة من قبل المالك!</p>
              {hostResponseNote && (
                <p className="mt-1 text-xs text-blue-600 font-semibold">
                  ملاحظة المالك: {hostResponseNote}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold text-amber-800">
              لديك 24 ساعة لإكمال الدفع قبل إلغاء الحجز تلقائيا.
              {remainingTime && (
                <span className="mt-1 block text-sm font-black">
                  الوقت المتبقي: {remainingTime}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePayment}
              disabled={paymentLoading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-md hover:bg-blue-700 transition animate-pulse cursor-pointer"
            >
              {paymentLoading ? "جاري التحضير..." : "ادفع الآن (Pay Now)"}
            </button>
          </div>
        );

      case "CHECK_IN_PENDING":
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 text-center">
              <p className="text-sm font-extrabold">تم الدفع بنجاح (Paid)</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">
                بانتظار الانتقال إلى السكن وتأكيد الاستلام.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => confirmReceipt(currentBooking.id).then(() => fetchBookings())}
                className="rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow hover:bg-emerald-700 transition cursor-pointer"
              >
                كل شيء على ما يرام
              </button>
              <button
                type="button"
                onClick={() => setShowProblemModal(true)}
                className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-black text-red-600 hover:bg-red-100 transition cursor-pointer"
              >
                هناك مشكلة!
              </button>
            </div>
          </div>
        );

      case "DISPUTED":
        return (
          <div className="space-y-3">
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-800 text-center">
              <p className="text-sm font-extrabold">تم تقديم شكوى</p>
              <p className="mt-1 text-xs text-red-600 font-semibold">
                الشكوى قيد المراجعة والتدقيق بواسطة إدارة المنصة وسيتم الفصل فيها قريباً.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-400 cursor-not-allowed border border-slate-200"
            >
              قيد مراجعة الإدارة
            </button>
          </div>
        );

      case "COMPLETED":
        return (
          <div className="space-y-3">
            <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-green-800 text-center">
              <p className="text-sm font-extrabold">مكتمل بنجاح</p>
              <p className="mt-1 text-xs text-green-600 font-semibold">
                تم الاستقرار في السكن بنجاح. نتمنى لك إقامة سعيدة!
              </p>
            </div>
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-green-600 py-3 text-sm font-black text-white cursor-not-allowed shadow"
            >
              تم الحجز والسكن
            </button>
          </div>
        );

      case "REFUNDED":
        return (
          <div className="space-y-3">
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 text-purple-800 text-center">
              <p className="text-sm font-extrabold">تم استرجاع المبلغ</p>
              {currentBooking.disputeResolution && (
                <p className="mt-1 text-xs text-purple-600 font-semibold">
                  ملاحظة الإدارة: {currentBooking.disputeResolution}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleBooking}
              className="w-full rounded-xl bg-[#1752F0] py-3 text-sm font-black text-white shadow"
            >
              حجز شقة أخرى
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div dir="rtl" className="sticky top-6 rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-100">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-[#0f172a]">
            {Number(monthlyRent).toLocaleString("ar-EG")}
          </span>
          <span className="text-sm text-slate-400">{currencyLabel} / شهر</span>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-slate-100" />

        {/* Price breakdown */}
        <div className="mb-4 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>إيجار الشهر الأول</span>
            <span className="font-semibold">{total.toLocaleString("ar-EG")} {currencyLabel}</span>
          </div>
          {deposit > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>تأمين مسترد</span>
              <span className="font-semibold">{deposit.toLocaleString("ar-EG")} {currencyLabel}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-[#0f172a]">
            <span>الإجمالي المطلوب دفعه</span>
            <span className="text-[#1752F0]">
              {(total + deposit).toLocaleString("ar-EG")} {currencyLabel}
            </span>
          </div>
        </div>

        {/* Dynamic Booking UI Actions */}
        {renderBookingState()}

        <p className="mt-3 text-center text-[10px] text-slate-400">
          * لن يتم سحب أي مبالغ مالية إلا بعد مراجعة وقبول المالك للطلب.
        </p>
      </div>

      {/* Paymob Payment Session Modal */}
      {iframeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">بوابة الدفع الآمنة (Paymob)</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">يرجى إدخال بيانات الكارت لإتمام الحجز</p>
              </div>
              <button
                onClick={handleClosePayment}
                className="rounded-lg p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Iframe */}
            <iframe src={iframeUrl} className="flex-1 w-full border-none" title="Paymob Payment Window" />
            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 text-center text-xs font-semibold text-slate-500">
              يرجى عدم إغلاق هذه النافذة. سيتم تحديث حالة الحجز تلقائياً فور تأكيد الدفع.
            </div>
          </div>
        </div>
      )}

      {/* Problem reporting modal */}
      {showProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-2">تقديم شكوى / الإبلاغ عن مشكلة</h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              يرجى توضيح تفاصيل المشكلة التي واجهتك أثناء الانتقال للسكن لمراجعتها من قبل الإدارة.
            </p>
            <form onSubmit={handleReportProblem} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">عنوان المشكلة (مطلوب)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الشقة تختلف عن الصور، السكن غير جاهز..."
                  value={problemReason}
                  onChange={(e) => setProblemReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">تفاصيل إضافية (اختياري)</label>
                <textarea
                  placeholder="اكتب هنا تفاصيل المشكلة بالتفصيل لمساعدتنا في التحقق..."
                  rows={4}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 transition cursor-pointer"
                >
                  تقديم الشكوى وتجميد الدفع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProblemModal(false);
                    setProblemReason("");
                    setProblemDescription("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification modal */}
      <VerificationRequiredModal open={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
    </>
  );
}
