import { useEffect, useState } from "react";
import { useBooking } from "../../bookings/hooks/useBooking";
import { usePayment } from "../../payments/hooks/usePayment";
import toast from "react-hot-toast";

export function ExpatriateBookingsPage() {
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    fetchBookings,
    confirmReceipt,
    reportProblem,
    cancelBooking,
  } = useBooking();

  const {
    loading: paymentLoading,
    iframeUrl,
    setIframeUrl,
    createPaymentSession,
    startPolling,
    stopPolling,
  } = usePayment();

  // Selected booking for dispute / cancellation
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemReason, setProblemReason] = useState("");
  const [problemDescription, setProblemDescription] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handlePayment = async (bookingId) => {
    try {
      const session = await createPaymentSession(bookingId);
      if (session?.iframeUrl) {
        startPolling(bookingId, () => {
          fetchBookings();
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClosePayment = () => {
    setIframeUrl(null);
    stopPolling();
    fetchBookings();
  };

  const submitProblem = async (e) => {
    e.preventDefault();
    if (!problemReason.trim()) return;
    try {
      await reportProblem(selectedBookingId, problemReason, problemDescription);
      setShowProblemModal(false);
      setSelectedBookingId(null);
      setProblemReason("");
      setProblemDescription("");
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const submitCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    try {
      await cancelBooking(selectedBookingId, cancelReason);
      setShowCancelModal(false);
      setSelectedBookingId(null);
      setCancelReason("");
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING_HOST_APPROVAL: {
        text: "بانتظار موافقة المالك",
        className: "bg-amber-50 text-amber-700 border border-amber-200",
      },
      PENDING_PAYMENT: {
        text: "تمت الموافقة - بانتظار الدفع",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
      },
      CHECK_IN_PENDING: {
        text: "مدفوع - بانتظار الدخول",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      },
      DISPUTED: {
        text: "تم تقديم شكوى",
        className: "bg-red-50 text-red-700 border border-red-200",
      },
      COMPLETED: {
        text: "مكتمل بنجاح",
        className: "bg-green-50 text-green-700 border border-green-200",
      },
      REJECTED: {
        text: "تم الرفض",
        className: "bg-rose-50 text-rose-700 border border-rose-200",
      },
      CANCELLED_BY_GUEST: {
        text: "ملغي من قبلك",
        className: "bg-slate-50 text-slate-600 border border-slate-200",
      },
      CANCELLED_BY_HOST: {
        text: "ملغي من المالك",
        className: "bg-slate-50 text-slate-600 border border-slate-200",
      },
      REFUNDED: {
        text: "تم استرجاع المبلغ",
        className: "bg-purple-50 text-purple-700 border border-purple-200",
      },
    };

    return (
      badges[status] || {
        text: status,
        className: "bg-slate-50 text-slate-600 border border-slate-200",
      }
    );
  };

  return (
    <div className="min-h-screen pb-12 pt-4 text-[#172033]" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">حجوزاتي</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            تتبع طلبات حجز العقارات، عمليات الدفع، وتأكيد انتقالك للسكن
          </p>
        </div>
        <button
          onClick={() => fetchBookings()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          تحديث القائمة
        </button>
      </div>

      {/* Loading state */}
      {bookingsLoading && bookings.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : bookingsError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
          حدث خطأ أثناء تحميل الحجوزات: {bookingsError}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600 mb-4">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M21 20.25V3c0-.621-.504-1.125-1.125-1.125H4.125C3.504 1.875 3 2.379 3 3v17.25m18 0V21m-18 0v-1.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3V1.875c0-.621.504-1.125 1.125-1.125h15.75c.621 0 1.125.504 1.125 1.125V3M7.5 6h9m-9 3.75h9m-9 3.75h3" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-slate-800">لا توجد حجوزات حتى الآن</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">ابدأ بالبحث عن شقق وتقديم طلب حجز.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const badge = getStatusBadge(booking.status);
            const coverPhoto = booking.listing?.photos?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop";

            return (
              <div
                key={booking.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition"
              >
                {/* Photo Header */}
                <div className="relative h-44 w-full bg-slate-100">
                  <img
                    src={coverPhoto}
                    alt={booking.listing?.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-3 top-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold text-white shadow backdrop-blur-md ${badge.className}`}>
                      {badge.text}
                    </span>
                  </div>
                </div>

                {/* Body info */}
                <div className="flex-1 p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                    {booking.listing?.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {booking.listing?.city}، {booking.listing?.governorate}
                  </p>

                  <div className="my-4 border-t border-slate-100" />

                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-slate-400 block">قيمة الإيجار:</span>
                      <span className="font-extrabold text-slate-800">
                        {booking.listing?.monthlyRent?.toLocaleString("ar-EG")} ج.م / شهر
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">تاريخ الدخول المفضل:</span>
                      <span className="font-extrabold text-slate-800">
                        {booking.preferredMoveInDate
                          ? new Date(booking.preferredMoveInDate).toLocaleDateString("ar-EG")
                          : "غير محدد"}
                      </span>
                    </div>
                  </div>

                  {booking.hostResponseNote && (
                    <div className="mt-3 rounded-lg bg-blue-50/50 p-2.5 text-xs text-blue-700 border border-blue-100/50">
                      <span className="font-black">ملاحظة المالك: </span>
                      {booking.hostResponseNote}
                    </div>
                  )}

                  {booking.rejectionReason && (
                    <div className="mt-3 rounded-lg bg-red-50/50 p-2.5 text-xs text-red-700 border border-red-100/50">
                      <span className="font-black">سبب الرفض: </span>
                      {booking.rejectionReason}
                    </div>
                  )}

                  {booking.disputeResolution && (
                    <div className="mt-3 rounded-lg bg-purple-50/50 p-2.5 text-xs text-purple-700 border border-purple-100/50">
                      <span className="font-black">قرار الإدارة: </span>
                      {booking.disputeResolution}
                    </div>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex flex-col gap-2">
                  {booking.status === "PENDING_PAYMENT" && (
                    <button
                      onClick={() => handlePayment(booking.id)}
                      disabled={paymentLoading}
                      className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition shadow cursor-pointer text-center"
                    >
                      {paymentLoading ? "جاري تحضير بوابة الدفع..." : "ادفع الآن (Pay Now)"}
                    </button>
                  )}

                  {booking.status === "CHECK_IN_PENDING" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => confirmReceipt(booking.id).then(() => fetchBookings())}
                        className="rounded-lg bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-700 transition cursor-pointer text-center"
                      >
                        كل شيء ممتاز
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setShowProblemModal(true);
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition cursor-pointer text-center"
                      >
                        هناك مشكلة!
                      </button>
                    </div>
                  )}

                  {["PENDING_HOST_APPROVAL", "PENDING_PAYMENT"].includes(booking.status) && (
                    <button
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setShowCancelModal(true);
                      }}
                      className="w-full text-center text-xs font-bold text-slate-400 hover:text-red-500 py-1 transition cursor-pointer"
                    >
                      إلغاء طلب الحجز
                    </button>
                  )}

                  {!["PENDING_PAYMENT", "CHECK_IN_PENDING", "PENDING_HOST_APPROVAL"].includes(booking.status) && (
                    <div className="text-center py-1.5 text-xs font-bold text-slate-400">
                      حالة الحجز مغلقة
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paymob Payment Session Modal */}
      {iframeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">بوابة الدفع الآمنة (Paymob)</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">يرجى إدخال بيانات البطاقة لإتمام حجز العقار</p>
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
            <iframe src={iframeUrl} className="flex-1 w-full border-none" title="Paymob Checkout Window" />
            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 text-center text-xs font-semibold text-slate-500">
              يرجى عدم إغلاق الصفحة. سيتم تحديث حالة حجزك تلقائياً بعد نجاح الدفع.
            </div>
          </div>
        </div>
      )}

      {/* Problem reporting modal */}
      {showProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl text-right">
            <h3 className="text-lg font-black text-slate-900 mb-2">تقديم شكوى وإيقاف تحرير الدفعة</h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              سيتم إرسال المشكلة إلى إدارة المنصة لمراجعتها وإصدار قرار بالاسترجاع أو التحويل المباشر.
            </p>
            <form onSubmit={submitProblem} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">عنوان المشكلة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الشقة بها عيوب جسيمة بالسباكة، تختلف تماماً عن الإعلان..."
                  value={problemReason}
                  onChange={(e) => setProblemReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">تفاصيل المشكلة والوصف</label>
                <textarea
                  placeholder="يرجى كتابة التفاصيل هنا لمساعدتنا في التحقق الفوري..."
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
                  إرسال وتجميد الدفع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProblemModal(false);
                    setSelectedBookingId(null);
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

      {/* Booking Cancellation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-right">
            <h3 className="text-base font-black text-slate-900 mb-2">تأكيد إلغاء الحجز</h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              هل أنت متأكد من رغبتك في إلغاء طلب حجز هذا العقار؟
            </p>
            <form onSubmit={submitCancel} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">سبب الإلغاء</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: غيرت رأيي، وجدت سكن آخر..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 transition cursor-pointer"
                >
                  نعم، إلغاء الحجز
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBookingId(null);
                    setCancelReason("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
