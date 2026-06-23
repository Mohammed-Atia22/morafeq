import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAdminListings } from "../hooks/useAdminListings";
import { useAdminUsers } from "../hooks/useAdminUsers";

// Custom SVG Icons matching the dummy UI
function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function CoinsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function ExclamationIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export function AdminDashboardPage() {
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useAdminStats();
  const { listings: pendingListings, loading: listingsLoading, status: listingStatus, setStatus: setListingStatus } = useAdminListings("PENDING_APPROVAL");
  const { users, loading: usersLoading } = useAdminUsers();

  // Filter users who have pending verifications
  const pendingVerifications = users.filter(user => user.verificationStatus === "PENDING");

  const handleRefreshAll = () => {
    refreshStats();
  };

  if (statsLoading || listingsLoading || usersLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
          حدث خطأ أثناء تحميل بيانات الإحصائيات: {statsError}
        </div>
      </div>
    );
  }

  // Get count variables
  const totalUsers = stats?.users?.total || 0;
  const totalListings = stats?.listings?.total || 0;
  const pendingListingsCount = stats?.listings?.pending || 0;
  const approvedListingsCount = stats?.listings?.approved || 0;
  const totalBookings = stats?.bookings?.total || 0;
  const confirmedBookings = stats?.bookings?.confirmed || 0;
  const totalTenants = stats?.users?.tenants || 0;
  const totalOwners = stats?.users?.owners || 0;
  const totalAdmins = stats?.users?.admins || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">لوحة التحكم</h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">صحة المنصة، الإيرادات، والمهام المعلقة</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span className="min-w-0 truncate">اليوم، {new Date().toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <button
            onClick={handleRefreshAll}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            تحديث
          </button>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
            <BellIcon className="h-5 w-5 text-slate-500" />
            {(pendingListingsCount > 0 || pendingVerifications.length > 0) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                {pendingListingsCount + pendingVerifications.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Urgent Attention Banner */}
        {(pendingListingsCount > 0 || pendingVerifications.length > 0) && (
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <ExclamationIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-red-700">هناك مهام معلقة تحتاج مراجعة فورية</div>
                <div className="mt-0.5 text-xs text-red-600">
                  يوجد عدد {pendingListingsCount} عقارات بانتظار الموافقة و {pendingVerifications.length} طلبات توثيق هوية معلقة.
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {pendingVerifications.length > 0 && (
                <Link
                  to="/admin/users"
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700"
                >
                  توثيق المستخدمين
                </Link>
              )}
              {pendingListingsCount > 0 && (
                <Link
                  to="/admin/listings"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800"
                >
                  مراجعة العقارات
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Pending Listings */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <HomeIcon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">بانتظار المراجعة</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mb-1">{pendingListingsCount}</div>
            <div className="text-xs font-bold text-slate-500">عقارات معلقة للموافقة</div>
          </div>

          {/* Approved Listings */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-500">
                <HomeIcon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">مقبولة</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mb-1">{approvedListingsCount}</div>
            <div className="text-xs font-bold text-slate-500">العقارات النشطة على المنصة</div>
          </div>

          {/* Total Users */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <UsersIcon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">إجمالي الأعضاء</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mb-1">{totalUsers}</div>
            <div className="text-xs font-bold text-slate-500">مسجل بالمنصة</div>
          </div>

          {/* Total Bookings */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                <CoinsIcon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">الحجوزات</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mb-1">{totalBookings}</div>
            <div className="text-xs font-bold text-slate-500">الحجوزات (المؤكدة: {confirmedBookings})</div>
          </div>
        </div>

        {/* Middle Area: Simple Charts & Info */}
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Listings Distribution */}
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">توزيع الإعلانات وحالاتها</h3>
            <p className="text-xs text-slate-400 mb-5 font-semibold">توزيع العقارات النشطة وغير النشطة بالمنصة</p>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative flex justify-center">
                {/* Simplified Circular Chart */}
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-slate-100">
                  <div className="absolute inset-0 rounded-full border-[10px] border-blue-500 border-r-transparent border-t-transparent" />
                  <div className="text-center">
                    <span className="text-2xl font-black text-slate-900">{totalListings}</span>
                    <p className="text-[10px] text-slate-400 font-bold">عقار إجمالي</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                    <span className="font-bold text-slate-700">نشط / مقبول</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{approvedListingsCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
                    <span className="font-bold text-slate-700">قيد المراجعة</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{pendingListingsCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                    <span className="font-bold text-slate-700">مرفوض / آخر</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{totalListings - approvedListingsCount - pendingListingsCount}</span>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-400">
                  تعد العقارات المقبولة هي المتاحة للمغتربين والطلاب للبحث والحجز.
                </div>
              </div>
            </div>
          </div>

          {/* Platform Activity summary */}
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">نشاط وحسابات المنصة</h3>
            <p className="text-xs text-slate-400 mb-5 font-semibold font-sans">توزيع المستخدمين حسب الأدوار</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>المستأجرين (طلاب ومغتربين)</span>
                  <span>{totalTenants} مستخدم</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${totalUsers > 0 ? (totalTenants / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>أصحاب العقارات (ملاك)</span>
                  <span>{totalOwners} مالك</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${totalUsers > 0 ? (totalOwners / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>مسؤولو النظام</span>
                  <span>{totalAdmins} مسؤول</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${totalUsers > 0 ? (totalAdmins / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Listings & Pending Verifications */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Pending Listings */}
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">أحدث العقارات المعلقة</h3>
                <p className="text-xs text-slate-400 font-semibold">تحت المراجعة والتدقيق</p>
              </div>
              <Link to="/admin/listings" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                عرض الكل &larr;
              </Link>
            </div>
            {pendingListings.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-slate-400 font-bold">
                لا توجد عقارات معلقة بانتظار المراجعة.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingListings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex items-center gap-3 sm:gap-4">
                    <img
                      src={listing.photos?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&h=60&fit=crop"}
                      className="h-12 w-16 rounded-lg object-cover"
                      alt={listing.title}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900">{listing.title}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{listing.area?.name || "منطقة غير محددة"}، {listing.city}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black text-slate-900">{listing.monthlyRent} ج.م</div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-black text-orange-600 mt-1">
                        <span className="h-1 w-1 rounded-full bg-orange-500" />
                        معلق
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Verifications */}
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">طلبات توثيق هوية المستخدمين</h3>
                <p className="text-xs text-slate-400 font-semibold">حسابات تحتاج لمراجعة صور البطاقة الشخصية</p>
              </div>
              <Link to="/admin/users" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                عرض كل المستخدمين &larr;
              </Link>
            </div>
            {pendingVerifications.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-slate-400 font-bold">
                لا توجد طلبات توثيق هوية معلقة حالياً.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingVerifications.slice(0, 3).map((pUser) => (
                  <div key={pUser.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
                        {pUser.firstName?.[0] || "م"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900">
                          {pUser.firstName} {pUser.lastName}
                        </div>
                        <div className="truncate text-[10px] font-semibold text-slate-400">{pUser.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-black text-orange-600">
                        توثيق معلق
                      </span>
                      <Link
                        to="/admin/users"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        مراجعة المستندات
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboardPage;
