import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useBooking } from "../../../bookings/hooks/useBooking";
import { usePayment } from "../../../payments/hooks/usePayment";
import { VerificationRequiredModal } from "../../../verification/components/VerificationRequiredModal";
import { PaymentBreakdownCard } from "../../../payments/components/PaymentBreakdownCard";
import {
  buildBreakdownFromListing,
  buildDisputeSettlementPreview,
  normalizePaymentBreakdown,
} from "../../../payments/utils/paymentBreakdown";
import {
  DisputeResolutionDialog,
  DisputeCancellationSuccess,
} from "../../../bookings/components/DisputeResolutionDialog";

const getReservationExpiry = (booking) => {
  if (booking?.paymentExpiresAt) return new Date(booking.paymentExpiresAt);
  const approvedAt = booking?.approvedAt || booking?.acceptedAt;
  if (!approvedAt) return null;
  return new Date(new Date(approvedAt).getTime() + 60 * 60 * 1000);
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

export function BookingCard({ monthlyRent, depositAmount, currency = "EGP", listingId, listingStatus, rooms = [] }) {
  const { user, refreshUser } = useAuth();
  const [checkIn, setCheckIn] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomSelectionError, setRoomSelectionError] = useState("");

  // Problem Modal state
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemReason, setProblemReason] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showCancellationSuccess, setShowCancellationSuccess] = useState(false);
  const [cancellationSettlement, setCancellationSettlement] = useState(null);

  // Reusable hooks
  const {
    bookings,
    loading: bookingLoading,
    fetchBookings,
    createBooking,
    confirmReceipt,
    reportProblem,
    continueAfterDispute,
    cancelAfterDispute,
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

  const listingBreakdown = useMemo(
    () => buildBreakdownFromListing({ monthlyRent, depositAmount }),
    [monthlyRent, depositAmount],
  );

  // Find the active booking for this listing
  const currentBooking = bookings.find(
    (b) =>
      b.listingId === Number(listingId) &&
      ![
        "CANCELLED_BY_GUEST",
        "CANCELLED_BY_HOST",
        "CANCELED",
        "EXPIRED",
        "CANCELLED_AFTER_DISPUTE",
      ].includes(b.status)
  );

  const invoiceBreakdown =
    paymentBreakdown ||
    normalizePaymentBreakdown(currentBooking?.payment) ||
    listingBreakdown;

  useEffect(() => {
    if (currentBooking?.status === "DISPUTE_RESOLVED_FOR_HOST") {
      setShowDisputeDialog(true);
    }
  }, [currentBooking?.id, currentBooking?.status]);

  const currencyLabel = currency === "EGP" ? "ج.م" : currency;

  // Handle booking creation
  const handleBooking = async () => {
    const currentUser = (await refreshUser?.()) ?? user;

    if (currentUser?.verificationStatus !== "APPROVED") {
      setShowVerificationModal(true);
      return;
    }

    if (rooms.length > 0 && !selectedRoomId) {
      setRoomSelectionError("يرجى اختيار الغرفة المناسبة قبل إرسال طلب الحجز");
      return;
    }

    try {
      await createBooking(
        Number(listingId),
        checkIn || undefined,
        guestMessage || undefined,
        selectedRoomId || undefined,
      );
      setCheckIn("");
      setGuestMessage("");
      setSelectedRoomId(null);
      setRoomSelectionError("");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async () => {
    if (!currentBooking) return;
    try {
      const session = await createPaymentSession(currentBooking.id);
      if (session?.amounts) {
        setPaymentBreakdown(normalizePaymentBreakdown(session));
      }
      if (session?.iframeUrl) {
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
          {rooms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-700">اختر الغرفة المناسبة</p>
              <div className="grid gap-2">
                {rooms.map((room) => {
                  const remaining = Math.max(
                    0,
                    Number(room.capacity || 0) - Number(room.occupiedCount || 0),
                  );
                  const isFull = remaining <= 0;
                  const image = room.images?.[0]?.imageUrl;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        if (isFull) {
                          setRoomSelectionError("هذه الغرفة ممتلئة، يرجى اختيار غرفة أخرى.");
                          return;
                        }
                        setSelectedRoomId(room.id);
                        setRoomSelectionError("");
                      }}
                      className={[
                        "flex items-center gap-3 rounded-xl border p-2 text-right transition",
                        selectedRoomId === room.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-200",
                        isFull ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                      ].join(" ")}
                    >
                      {image && (
                        <img
                          src={image}
                          alt={room.roomName}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-slate-800">
                          {room.roomName}
                        </span>
                        <span className="block text-[11px] font-bold text-slate-500">
                          {isFull
                            ? "ممتلئة"
                            : `الأماكن المتبقية: ${remaining.toLocaleString("ar-EG")} من ${Number(room.capacity || 0).toLocaleString("ar-EG")}`}
                        </span>
                      </span>
                      {isFull && (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                          ممتلئة
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {roomSelectionError && (
                <p className="text-[11px] font-bold text-red-600">
                  {roomSelectionError}
                </p>
              )}
            </div>
          )}

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
              لديك ساعة واحدة لإكمال الدفع قبل إلغاء الحجز تلقائيا.
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

      case "DISPUTE_RESOLVED_FOR_HOST":
        return (
          <div className="space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-amber-900 text-center">
              <p className="text-sm font-extrabold">تم حل النزاع — يلزم اتخاذ قرار</p>
              <p className="mt-1 text-xs font-semibold">
                يرجى اختيار متابعة الحجز أو إلغائه واسترداد المبلغ المستحق.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDisputeDialog(true)}
              className="w-full rounded-xl bg-[#1752F0] py-3 text-sm font-black text-white shadow hover:bg-[#1240c4] transition cursor-pointer"
            >
              عرض تفاصيل القرار
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
        <PaymentBreakdownCard
          breakdown={invoiceBreakdown}
          title="تفاصيل الفاتورة"
          className="mb-4"
        />

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

      <DisputeResolutionDialog
        open={showDisputeDialog && currentBooking?.status === "DISPUTE_RESOLVED_FOR_HOST"}
        booking={currentBooking}
        payment={currentBooking?.payment}
        loading={bookingLoading}
        onContinue={async () => {
          await continueAfterDispute(currentBooking.id);
          setShowDisputeDialog(false);
          fetchBookings();
        }}
        onCancelRequest={async () => {
          const result = await cancelAfterDispute(currentBooking.id);
          const settlement = buildDisputeSettlementPreview(currentBooking?.payment) || {
            totalAmount: result?.settlement?.totalPaid,
            expectedRefund: result?.settlement?.guestRefund,
            hostCompensation: result?.settlement?.hostCompensation,
            retainedPlatformFee: result?.settlement?.platformFee,
            currency: result?.settlement?.currency || "EGP",
          };
          setCancellationSettlement(settlement);
          setShowDisputeDialog(false);
          setShowCancellationSuccess(true);
          fetchBookings();
        }}
        onClose={() => setShowDisputeDialog(false)}
      />

      <DisputeCancellationSuccess
        open={showCancellationSuccess}
        settlement={cancellationSettlement}
        onClose={() => {
          setShowCancellationSuccess(false);
          setCancellationSettlement(null);
          fetchBookings();
        }}
      />
    </>
  );
}
