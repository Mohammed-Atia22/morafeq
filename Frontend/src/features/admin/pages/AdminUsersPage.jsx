import { useState } from "react";
import { useAdminUsers } from "../hooks/useAdminUsers";

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2ZM10 20h4" />
    </svg>
  );
}

export function AdminUsersPage() {
  const {
    users,
    meta,
    loading,
    page,
    setPage,
    changeUserRole,
    toggleUserActive,
    approveVerification,
    rejectVerification,
  } = useAdminUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVerification, setSelectedVerification] = useState(null); // holds { user, verification }
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Frontend search filter
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const nameMatch =
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term);
    const emailMatch = u.email?.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  const getVerificationBadge = (user) => {
    const status = user.verificationStatus;
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            موثق
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            مرفوض التوثيق
          </span>
        );
      case "PENDING":
        return (
          <button
            onClick={() => handleOpenVerification(user)}
            className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            مراجعة طلب التوثيق
          </button>
        );
      case "NOT_STARTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            غير موثق
          </span>
        );
    }
  };

  const handleOpenVerification = (user) => {
    if (user.verification) {
      setSelectedVerification({ user, verification: user.verification });
      setRejectionReason("");
      setIsRejecting(false);
    } else {
      alert("لم يتم العثور على ملفات التوثيق لهذا الحساب");
    }
  };

  const handleCloseVerification = () => {
    setSelectedVerification(null);
    setRejectionReason("");
    setIsRejecting(false);
  };

  const handleApproveVerify = async () => {
    if (!selectedVerification) return;
    const success = await approveVerification(selectedVerification.verification.id);
    if (success) {
      handleCloseVerification();
    }
  };

  const handleRejectVerify = async (e) => {
    e.preventDefault();
    if (!selectedVerification) return;
    if (!rejectionReason.trim()) {
      alert("يرجى إدخال سبب الرفض");
      return;
    }
    const success = await rejectVerification(selectedVerification.verification.id, rejectionReason);
    if (success) {
      handleCloseVerification();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">دليل المستخدمين</h1>
          <p className="mt-0.5 text-xs text-slate-500">إدارة حسابات الطلاب وأصحاب العقارات وتدقيق التوثيق</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span>اليوم، {new Date().toLocaleDateString("ar-EG", { month: "long", day: "numeric" })}</span>
          </div>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
            <BellIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* Search bar & statistics counts */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-slate-500 font-bold text-xs">
            إجمالي الأعضاء في الصفحة: {filteredUsers.length} مستخدم
          </div>

          <div className="relative">
            <svg
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-4 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-400">
            لا توجد حسابات مطابقة للبحث.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 font-extrabold text-slate-400">
                  <th className="py-3.5 px-6">الحالة ونشاط الحساب</th>
                  <th className="py-3.5 px-4">العقارات / الحجوزات</th>
                  <th className="py-3.5 px-4">تاريخ التسجيل</th>
                  <th className="py-3.5 px-4">توثيق الهوية</th>
                  <th className="py-3.5 px-4">صلاحيات الحساب (الدور)</th>
                  <th className="py-3.5 px-4">البريد الإلكتروني</th>
                  <th className="py-3.5 px-6">المستخدم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                          user.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        }`}>
                          {user.isActive ? "نشط" : "معطل"}
                        </span>
                        <button
                          onClick={() => toggleUserActive(user.id, !user.isActive)}
                          className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                            user.isActive
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-500">
                      <span className="text-blue-600">{user._count?.listings || 0} عقار</span>
                      <span className="mx-1">/</span>
                      <span className="text-purple-600">{user._count?.bookings || 0} حجز</span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="py-4 px-4">{getVerificationBadge(user)}</td>
                    <td className="py-4 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-100"
                      >
                        <option value="GUEST">مغترب / طالب</option>
                        <option value="HOST">مالك عقار</option>
                        <option value="ADMIN">مسؤول نظام</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{user.email}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
                            {user.firstName?.[0] || "م"}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{user.firstName} {user.lastName}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <span className="text-slate-500 font-bold">
                  عرض صفحة {meta.page} من {meta.totalPages} صفحات
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))}
                    disabled={page === meta.totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verification Review Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  مراجعة مستندات الهوية للعميل: {selectedVerification.user.firstName} {selectedVerification.user.lastName}
                </h3>
                <button onClick={handleCloseVerification} className="text-slate-400 hover:text-slate-600 text-lg font-black">&times;</button>
              </div>

              {/* ID Images layout */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400">وجه بطاقة الهوية (ID Front):</span>
                    <a href={selectedVerification.verification.idFrontUrl} target="_blank" rel="noreferrer" className="block mt-1">
                      <img
                        src={selectedVerification.verification.idFrontUrl}
                        className="h-40 w-full rounded-xl object-cover border border-slate-200 hover:opacity-90 transition"
                        alt="ID Front"
                      />
                    </a>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400">ظهر بطاقة الهوية (ID Back):</span>
                    <a href={selectedVerification.verification.idBackUrl} target="_blank" rel="noreferrer" className="block mt-1">
                      <img
                        src={selectedVerification.verification.idBackUrl}
                        className="h-40 w-full rounded-xl object-cover border border-slate-200 hover:opacity-90 transition"
                        alt="ID Back"
                      />
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400">صورة شخصية مع الهوية (Selfie with ID):</span>
                  <a href={selectedVerification.verification.selfieUrl} target="_blank" rel="noreferrer" className="block mt-1">
                    <img
                      src={selectedVerification.verification.selfieUrl}
                      className="h-64 w-full rounded-xl object-cover border border-slate-200 hover:opacity-90 transition"
                      alt="Selfie with ID"
                    />
                  </a>
                </div>
              </div>

              {/* Rejection input and Actions */}
              {!isRejecting ? (
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={handleApproveVerify}
                    className="rounded-xl bg-green-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-700 shadow"
                  >
                    توثيق الهوية واعتماد الحساب
                  </button>
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow"
                  >
                    رفض مستندات الهوية
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRejectVerify} className="border-t border-slate-100 pt-4">
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-2">سبب رفض التوثيق (مطلوب):</label>
                    <textarea
                      rows="3"
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="اشرح للمستخدم سبب الرفض (مثال: الصورة غير واضحة، الهوية منتهية الصلاحية...)"
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      تراجع
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow"
                    >
                      تأكيد الرفض
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminUsersPage;
