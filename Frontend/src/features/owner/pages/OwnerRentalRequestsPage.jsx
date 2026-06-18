import { useEffect, useState } from "react";
import { useOwnerRequests } from "../hooks/useOwnerRequests";

export function OwnerRentalRequestsPage() {
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    fetchRequests,
    respondToRequest,
  } = useOwnerRequests();

  // Modal / Action states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // "ACCEPT" or "REJECT"
  const [responseNote, setResponseNote] = useState("");
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openActionModal = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setResponseNote("");
    setNoteError("");
  };

  const closeActionModal = () => {
    setSelectedRequest(null);
    setActionType(null);
    setResponseNote("");
    setNoteError("");
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!responseNote.trim()) {
      setNoteError("الملاحظة مطلوبة قبل إتمام الإجراء");
      return;
    }

    try {
      await respondToRequest(selectedRequest.id, actionType, responseNote);
      closeActionModal();
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusLabel = (status) => {
    const statuses = {
      PENDING_HOST_APPROVAL: {
        text: "بانتظار موافقتك",
        className: "bg-amber-50 text-amber-700 border border-amber-200",
      },
      PENDING_PAYMENT: {
        text: "تم القبول - بانتظار الدفع من المستأجر",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
      },
      CHECK_IN_PENDING: {
        text: "تم الدفع - المستأجر بانتظار الانتقال للسكن",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      },
      DISPUTED: {
        text: "هناك مشكلة / نزاع قائم",
        className: "bg-red-50 text-red-700 border border-red-200",
      },
      COMPLETED: {
        text: "مكتمل وتم تحرير المبالغ",
        className: "bg-green-50 text-green-700 border border-green-200",
      },
      REJECTED: {
        text: "تم الرفض من قبلك",
        className: "bg-rose-50 text-rose-700 border border-rose-200",
      },
      CANCELLED_BY_GUEST: {
        text: "ملغي من المستأجر",
        className: "bg-slate-50 text-slate-600 border border-slate-200",
      },
      CANCELLED_BY_HOST: {
        text: "ملغي من قبلك",
        className: "bg-slate-50 text-slate-600 border border-slate-200",
      },
      REFUNDED: {
        text: "تم استرداد المبلغ للمستأجر",
        className: "bg-purple-50 text-purple-700 border border-purple-200",
      },
    };

    return (
      statuses[status] || {
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
          <h1 className="text-xl font-extrabold text-slate-900">طلبات الإيجار</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            راجع طلبات استئجار عقاراتك من الطلاب والمغتربين واتخذ إجراءات القبول أو الرفض
          </p>
        </div>
        <button
          onClick={() => fetchRequests()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          تحديث الطلبات
        </button>
      </div>

      {/* Loading state */}
      {requestsLoading && requests.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : requestsError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
          حدث خطأ أثناء تحميل طلبات الإيجار: {requestsError}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 text-slate-600 mb-4">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-slate-800">لا توجد طلبات إيجار حالياً</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">ستظهر هنا الطلبات الجديدة فور قيام المستأجرين بالحجز.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => {
            const coverPhoto = request.listing?.photos?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop";
            const statusStyle = getStatusLabel(request.status);

            return (
              <div
                key={request.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition"
              >
                {/* Photo & Status */}
                <div className="relative h-40 w-full bg-slate-100">
                  <img
                    src={coverPhoto}
                    alt={request.listing?.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-3 top-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow backdrop-blur-md ${statusStyle.className}`}>
                      {statusStyle.text}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 p-5">
                  {/* Listing Info */}
                  <h3 className="text-xs font-extrabold text-blue-600 mb-0.5">العقار المعني:</h3>
                  <h2 className="text-sm font-black text-slate-900 line-clamp-1 mb-3">
                    {request.listing?.title}
                  </h2>

                  {/* Expatriate Info */}
                  <div className="rounded-xl bg-slate-50 p-3 mb-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">معلومات المستأجر</h3>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                        {request.guest?.firstName?.[0] || "م"}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-800">
                          {request.guest?.firstName} {request.guest?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">{request.guest?.email}</div>
                      </div>
                    </div>
                    {request.guest?.verificationStatus === "APPROVED" ? (
                      <span className="mt-2 inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-bold text-green-600 border border-green-100">
                        هوية موثقة
                      </span>
                    ) : (
                      <span className="mt-2 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-200">
                        الهوية قيد المراجعة
                      </span>
                    )}
                  </div>

                  {/* Guest optional message */}
                  {request.guestMessage && (
                    <div className="mb-4 rounded-xl border border-slate-100 bg-[#E8F0FF]/30 p-3 text-xs text-[#0b62d8]">
                      <span className="font-extrabold block mb-1">رسالة المستأجر:</span>
                      <p className="font-semibold italic text-slate-700">"{request.guestMessage}"</p>
                    </div>
                  )}

                  {request.hostResponseNote && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <span className="font-extrabold block mb-1">ملاحظتك السابقة:</span>
                      <p className="font-semibold text-slate-600">{request.hostResponseNote}</p>
                    </div>
                  )}

                  {request.rejectionReason && (
                    <div className="rounded-xl border border-slate-100 bg-rose-50/50 p-3 text-xs text-rose-700">
                      <span className="font-extrabold block mb-1">سبب الرفض:</span>
                      <p className="font-semibold">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                {request.status === "PENDING_HOST_APPROVAL" ? (
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50 p-4">
                    <button
                      onClick={() => openActionModal(request, "ACCEPT")}
                      className="rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-sm transition cursor-pointer text-center"
                    >
                      قبول الطلب
                    </button>
                    <button
                      onClick={() => openActionModal(request, "REJECT")}
                      className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-black text-red-600 hover:bg-red-100 transition cursor-pointer text-center"
                    >
                      رفض الطلب
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 bg-slate-50 p-3 text-center text-xs font-semibold text-slate-400">
                    تم اتخاذ الإجراء
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action modal (Accept/Reject notes) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-right">
            <h3 className="text-base font-black text-slate-900 mb-2">
              {actionType === "ACCEPT" ? "قبول طلب الإيجار" : "رفض طلب الإيجار"}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              {actionType === "ACCEPT"
                ? "يرجى كتابة ملاحظة للمستأجر (مثال: أهلاً بك، يرجى الاستعداد للدفع وتأكيد الحجز)"
                : "يرجى كتابة سبب الرفض لتوضيحه للمستأجر (مطلوب)"}
            </p>
            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">الملاحظات / سبب الرفض</label>
                <textarea
                  required
                  placeholder={
                    actionType === "ACCEPT"
                      ? "اكتب رسالة ترحيبية أو إرشادات للمستأجر هنا..."
                      : "اكتب سبب الرفض بالتفصيل هنا..."
                  }
                  rows={4}
                  value={responseNote}
                  onChange={(e) => {
                    setResponseNote(e.target.value);
                    if (e.target.value.trim()) setNoteError("");
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0] ${
                    noteError ? "border-red-500" : "border-slate-200"
                  }`}
                />
                {noteError && <p className="text-[10px] font-bold text-red-500">{noteError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white transition cursor-pointer ${
                    actionType === "ACCEPT"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionType === "ACCEPT" ? "تأكيد القبول" : "تأكيد الرفض"}
                </button>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
