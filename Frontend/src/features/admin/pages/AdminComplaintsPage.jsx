import { useEffect, useState } from "react";
import { adminApi } from "../services/adminApi";
import { paymentsApi } from "../../payments/services/paymentsApi";
import toast from "react-hot-toast";

export function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resolution modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionType, setResolutionType] = useState(null); // "REFUND" or "RELEASE"
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getComplaints();
      setComplaints(data || []);
    } catch (err) {
      setError(err.message || "Failed to load complaints");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openResolutionModal = (complaint, type) => {
    setSelectedComplaint(complaint);
    setResolutionType(type);
    setResolutionNote("");
  };

  const closeResolutionModal = () => {
    setSelectedComplaint(null);
    setResolutionType(null);
    setResolutionNote("");
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      toast.error("يرجى إدخال ملاحظات القرار");
      return;
    }

    setActionLoading(true);
    const paymentId = selectedComplaint.payment?.id;
    if (!paymentId) {
      toast.error("لم يتم العثور على سجل دفع لهذا الحجز");
      setActionLoading(false);
      return;
    }

    try {
      if (resolutionType === "REFUND") {
        // Approve Refund -> calls refund endpoint
        await paymentsApi.refundPayment(paymentId, resolutionNote);
        toast.success("تم إقرار الاسترجاع بنجاح وعكس العملية مالياً");
      } else {
        // Reject Complaint -> releases payment to owner
        await paymentsApi.releasePayment(paymentId, resolutionNote);
        toast.success("تم رفض الشكوى وتحرير المبالغ لصاحب السكن");
      }
      closeResolutionModal();
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || "فشل إرسال قرار حل النزاع");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#172033]" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">الشكاوى والنزاعات المعلقة</h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            مراجعة نزاعات الحجز، الاستماع للمشكلات، وتحديد مصير المعاملات المالية المعلقة
          </p>
        </div>
        <button
          onClick={fetchComplaints}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          تحديث النزاعات
        </button>
      </header>

      {/* Main Content */}
      <div className="p-8">
        {loading && complaints.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
            حدث خطأ أثناء تحميل الشكاوى: {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 text-slate-600 mb-4">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-slate-800">لا توجد شكاوى أو نزاعات معلقة</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">كافة الحجوزات والمدفوعات مستقرة.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {complaints.map((complaint) => {
              const amount = complaint.payment ? complaint.payment.amount / 100 : 0;

              return (
                <div
                  key={complaint.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* ID & Date */}
                    <div className="flex justify-between items-center mb-4 text-xs font-semibold text-slate-400">
                      <span>رقم الحجز: #{complaint.id}</span>
                      <span>
                        تاريخ النزاع: {complaint.disputedAt ? new Date(complaint.disputedAt).toLocaleString("ar-EG") : "غير محدد"}
                      </span>
                    </div>

                    {/* Complaint Reason banner */}
                    <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-4 text-right">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-wide">الشكوى المقدمة</span>
                      <h4 className="text-sm font-extrabold text-red-900 mt-1">{complaint.disputeReason}</h4>
                      {complaint.disputeDescription && (
                        <p className="text-xs text-red-700 font-semibold mt-1.5 whitespace-pre-wrap">
                          {complaint.disputeDescription}
                        </p>
                      )}
                    </div>

                    {/* People details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Guest info */}
                      <div className="rounded-xl bg-slate-50 p-3 text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">المستأجر (الشاكي)</span>
                        <div className="text-xs font-extrabold text-slate-800">
                          {complaint.guest?.firstName} {complaint.guest?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{complaint.guest?.email}</div>
                        {complaint.guest?.phone && (
                          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{complaint.guest?.phone}</div>
                        )}
                      </div>

                      {/* Owner info */}
                      <div className="rounded-xl bg-slate-50 p-3 text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">المالك (المشكو في حقه)</span>
                        <div className="text-xs font-extrabold text-slate-800">
                          {complaint.listing?.host?.firstName} {complaint.listing?.host?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{complaint.listing?.host?.email}</div>
                        {complaint.listing?.host?.phone && (
                          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{complaint.listing?.host?.phone}</div>
                        )}
                      </div>
                    </div>

                    {/* Listing & Payment details */}
                    <div className="rounded-xl border border-slate-100 p-4 text-xs font-semibold text-slate-600 mb-4 space-y-2">
                      <div className="flex justify-between">
                        <span>العقار:</span>
                        <span className="font-extrabold text-slate-800">{complaint.listing?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>موقع العقار:</span>
                        <span className="font-extrabold text-slate-800">
                          {complaint.listing?.city}، {complaint.listing?.governorate}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                        <span>إجمالي القيمة المعلقة بالدفع:</span>
                        <span className="font-black text-blue-600">{amount.toLocaleString("ar-EG")} ج.م</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 mt-2">
                    <button
                      onClick={() => openResolutionModal(complaint, "REFUND")}
                      className="rounded-xl bg-red-600 py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-sm transition cursor-pointer text-center"
                    >
                      قبول الاسترجاع (Refund)
                    </button>
                    <button
                      onClick={() => openResolutionModal(complaint, "RELEASE")}
                      className="rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-sm transition cursor-pointer text-center"
                    >
                      رفض الشكوى وصرف المبالغ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution decision dialog modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-right">
            <h3 className="text-base font-black text-slate-900 mb-1">
              {resolutionType === "REFUND" ? "الموافقة على رد المبالغ المدفوعة" : "رفض الشكوى وتحرير المبالغ للطرف المالك"}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              {resolutionType === "REFUND"
                ? "سيتم استرجاع مبلغ الإيجار إلى كارت المستأجر تلقائياً عن طريق بوابة Paymob وإلغاء المعاملة المعلقة"
                : "سيتم تحرير المبلغ ونقله إلى محفظة المالك المتاحة كدفعة مستلمة وتسجيل العقار كمحجوز"}
            </p>
            <form onSubmit={handleResolve} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">سبب القرار وملاحظات الإدارة (مطلوب)</label>
                <textarea
                  required
                  placeholder="اكتب هنا التوجيه أو التقرير الإداري لاتخاذ هذا القرار..."
                  rows={4}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white transition cursor-pointer ${resolutionType === "REFUND"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                    } disabled:opacity-50`}
                >
                  {actionLoading ? "جاري الحفظ..." : "تأكيد وإصدار القرار"}
                </button>
                <button
                  type="button"
                  onClick={closeResolutionModal}
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
