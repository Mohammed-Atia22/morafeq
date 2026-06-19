import { useState } from "react";
import { useAdminListings } from "../hooks/useAdminListings";

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

export function AdminListingsPage() {
  const {
    listings,
    meta,
    loading,
    status,
    setStatus,
    page,
    setPage,
    approveListing,
    rejectListing,
    suspendListing,
  } = useAdminListings("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | 'suspend'

  // Filter listings based on frontend search term (title or host name)
  const filteredListings = listings.filter((listing) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = listing.title?.toLowerCase().includes(term);
    const hostMatch =
      listing.host?.firstName?.toLowerCase().includes(term) ||
      listing.host?.lastName?.toLowerCase().includes(term);
    return titleMatch || hostMatch;
  });

  const getStatusBadge = (listingStatus) => {
    switch (listingStatus) {
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            قيد المراجعة
          </span>
        );
      case "APPROVED":
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            مقبول / نشط
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            مرفوض
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            معلق
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            {listingStatus}
          </span>
        );
    }
  };

  const handleOpenReview = (listing) => {
    setSelectedListing(listing);
    setNote("");
    setReason("");
    setActionType(null);
  };

  const handleCloseReview = () => {
    setSelectedListing(null);
    setNote("");
    setReason("");
    setActionType(null);
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;

    let success = false;
    if (actionType === "approve") {
      success = await approveListing(selectedListing.id, note);
    } else if (actionType === "reject") {
      if (reason.length < 10) {
        alert("يجب أن يكون سبب الرفض 10 أحرف على الأقل");
        return;
      }
      success = await rejectListing(selectedListing.id, reason);
    } else if (actionType === "suspend") {
      if (!reason.trim()) {
        alert("يرجى إدخال سبب التعليق");
        return;
      }
      success = await suspendListing(selectedListing.id, reason);
    }

    if (success) {
      handleCloseReview();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">إدارة العقارات</h1>
          <p className="mt-0.5 text-xs text-slate-500">مراجعة وإدارة طلبات العقارات الواردة</p>
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
        {/* Tabs & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatus("")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                status === "" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatus("PENDING_APPROVAL")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                status === "PENDING_APPROVAL" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              معلق
            </button>
            <button
              onClick={() => setStatus("APPROVED")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                status === "APPROVED" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-green-400" />
              مقبول
            </button>
            <button
              onClick={() => setStatus("REJECTED")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                status === "REJECTED" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-400" />
              مرفوض
            </button>
            <button
              onClick={() => setStatus("SUSPENDED")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                status === "SUSPENDED" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              معلق مؤقتاً
            </button>
          </div>

          {/* Search bar */}
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
              placeholder="البحث بالعنوان أو المالك..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-4 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
            />
          </div>
        </div>

        {/* Table Container */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-400">
            لا توجد عقارات مطابقة للخيارات المحددة.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 font-extrabold text-slate-400">
                  <th className="py-3.5 px-6">الإجراء</th>
                  <th className="py-3.5 px-4">تاريخ الإضافة</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">المالك</th>
                  <th className="py-3.5 px-4">الإشغال</th>
                  <th className="py-3.5 px-4">السعر شهرياً</th>
                  <th className="py-3.5 px-4">نوع الغرفة</th>
                  <th className="py-3.5 px-6">العقار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleOpenReview(listing)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        مراجعة
                      </button>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(listing.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(listing.status)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">
                          {listing.host?.firstName?.[0] || "م"}
                        </div>
                        <span>
                          {listing.host?.firstName} {listing.host?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="font-black text-slate-800">
                          {Number(listing.reservedPlaces || 0).toLocaleString("ar-EG")} / {Number(listing.maxTenants || 0).toLocaleString("ar-EG")}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                          المتبقي: {Number(listing.availablePlaces || 0).toLocaleString("ar-EG")}
                        </div>
                        {listing.isFull && (
                          <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600">
                            مكتمل السعة
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900">
                      {listing.monthlyRent.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ج.م</span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {listing.roomType === "ENTIRE_PLACE"
                        ? "سكن كامل"
                        : listing.roomType === "PRIVATE_ROOM"
                          ? "غرفة خاصة"
                          : "غرفة مشتركة"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={listing.photos?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&h=60&fit=crop"}
                          className="h-10 w-14 rounded-lg object-cover"
                          alt={listing.title}
                        />
                        <div>
                          <div className="font-bold text-slate-950">{listing.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{listing.area?.name || "منطقة غير محددة"}، {listing.city}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
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

        {/* Listing Review Modal */}
        {selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-base font-extrabold text-slate-900">مراجعة العقار: {selectedListing.title}</h3>
                <button onClick={handleCloseReview} className="text-slate-400 hover:text-slate-600 text-lg font-black">&times;</button>
              </div>

              {/* Photos Carousel */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {selectedListing.photos?.slice(0, 3).map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    className="h-24 w-full rounded-xl object-cover border border-slate-100"
                    alt={`Photo ${index + 1}`}
                  />
                ))}
              </div>

              {/* Listing Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs mb-6 border-t border-slate-100 pt-4">
                {/* 1. Basic Info */}
                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 mb-2 text-sm border-b border-slate-100 pb-1">المعلومات الأساسية</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-bold">نوع العقار:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {{
                          APARTMENT: "شقة",
                          HOUSE: "منزل",
                          VILLA: "فيلا",
                          CABIN: "كابينة",
                          STUDIO: "استوديو",
                          OTHER: "أخرى"
                        }[selectedListing.propertyType] || selectedListing.propertyType}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">نوع الغرفة:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {{
                          ENTIRE_PLACE: "سكن كامل",
                          PRIVATE_ROOM: "غرفة خاصة",
                          SHARED_ROOM: "غرفة مشتركة"
                        }[selectedListing.roomType] || selectedListing.roomType}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">الإيجار الشهري:</span>
                      <p className="font-extrabold mt-0.5 text-blue-600">{selectedListing.monthlyRent?.toLocaleString()} ج.م / شهرياً</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">مبلغ التأمين:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {selectedListing.depositAmount ? `${selectedListing.depositAmount.toLocaleString()} ج.م` : "لا يوجد"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">متاح من تاريخ:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {selectedListing.availableFrom
                          ? new Date(selectedListing.availableFrom).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
                          : "غير محدد"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">مدة الإقامة:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        من {selectedListing.minimumStayMonths || 1} أشهر {selectedListing.maximumStayMonths ? `إلى ${selectedListing.maximumStayMonths} أشهر` : "إلى غير محدد"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Address & Location */}
                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 mb-2 text-sm border-b border-slate-100 pb-1">الموقع والعنوان</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold">العنوان التفصيلي:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {selectedListing.streetName} {selectedListing.buildingNumber ? `عمارة ${selectedListing.buildingNumber}` : ""}
                        {selectedListing.floorNumber ? `، الطابق ${selectedListing.floorNumber}` : ""}
                        {selectedListing.apartmentNumber ? `، شقة ${selectedListing.apartmentNumber}` : ""}
                        {selectedListing.area?.name ? `، منطقة ${selectedListing.area.name}` : ""}
                        {` ، ${selectedListing.city} ، ${selectedListing.governorate} ، ${selectedListing.country}`}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold">علامة مميزة قريبة:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">{selectedListing.nearbyLandmark || "لا يوجد"}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Specs & Rules */}
                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 mb-2 text-sm border-b border-slate-100 pb-1">المواصفات والقوانين</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-bold">المساحة والمواصفات:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {selectedListing.bedrooms} غرف نوم | {selectedListing.beds} أسرة | {selectedListing.bathrooms} حمامات
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">أقصى عدد للمستأجرين:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">{selectedListing.maxTenants} أشخاص</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">الأماكن المحجوزة:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">{Number(selectedListing.reservedPlaces || 0).toLocaleString("ar-EG")}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">الأماكن المتبقية:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">{Number(selectedListing.availablePlaces || 0).toLocaleString("ar-EG")}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">حالة التأثيث:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">{selectedListing.furnished ? "مفروش" : "غير مفروش"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">المرافق والإنترنت:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {selectedListing.utilitiesIncluded ? "المرافق مشمولة" : "المرافق غير مشمولة"} | {selectedListing.internetIncluded ? "الإنترنت مشمول" : "الإنترنت غير مشمول"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">تفضيل جنس المستأجر:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {{
                          MALE: "ذكور فقط",
                          FEMALE: "إناث فقط",
                          ANY: "أي جنس / مشترك"
                        }[selectedListing.genderPreference] || selectedListing.genderPreference}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">قوانين التدخين:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">
                        {{
                          ALLOWED: "مسموح التدخين",
                          NOT_ALLOWED: "غير مسموح التدخين"
                        }[selectedListing.smokingPolicy] || selectedListing.smokingPolicy}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Amenities list */}
                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 mb-2 text-sm border-b border-slate-100 pb-1">الميزات والخدمات</h4>
                  {selectedListing.amenities && selectedListing.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedListing.amenities.map((amenity, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-lg text-[10px] font-black">
                          {amenity.amenityKey}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-extrabold mt-0.5 text-slate-400">لا توجد خدمات محددة</p>
                  )}
                </div>

                {/* 5. Host Info */}
                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 mb-2 text-sm border-b border-slate-100 pb-1">معلومات المضيف (المالك)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-bold">اسم المضيف:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">{selectedListing.host?.firstName} {selectedListing.host?.lastName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">البريد الإلكتروني:</span>
                      <p className="font-extrabold mt-0.5 text-slate-800">{selectedListing.host?.email}</p>
                    </div>
                    {selectedListing.host?.phone && (
                      <div className="col-span-2">
                        <span className="text-slate-400 font-bold">رقم الهاتف:</span>
                        <p className="font-extrabold mt-0.5 text-slate-800" style={{ direction: "ltr", textAlign: "right" }}>{selectedListing.host?.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Description */}
                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold text-sm block border-b border-slate-100 pb-1 mb-2">الوصف:</span>
                  <p className="font-bold mt-1 text-slate-600 bg-white p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                    {selectedListing.description}
                  </p>
                </div>
              </div>

              {/* Action Form */}
              <form onSubmit={handleAction} className="border-t border-slate-100 pt-4">
                {actionType === null ? (
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActionType("approve")}
                      className="rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-green-700 shadow"
                    >
                      قبول وإتاحة الإعلان
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType("reject")}
                      className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow"
                    >
                      رفض الإعلان
                    </button>
                    {selectedListing.status === "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => setActionType("suspend")}
                        className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-600 shadow"
                      >
                        تعليق مؤقت
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {actionType === "approve" && (
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-700 mb-2">ملاحظة اختيارية للمضيف:</label>
                        <textarea
                          rows="3"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="اكتب تهنئة أو توجيه للمضيف..."
                          className="w-full rounded-xl border border-slate-200 p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    {(actionType === "reject" || actionType === "suspend") && (
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-700 mb-2">سبب الإجراء (مطلوب):</label>
                        <textarea
                          rows="3"
                          required
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={actionType === "reject" ? "لماذا تم رفض العقار؟ (١٠ أحرف على الأقل)" : "سبب تعليق العقار..."}
                          className="w-full rounded-xl border border-slate-200 p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActionType(null)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        تراجع
                      </button>
                      <button
                        type="submit"
                        className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow ${
                          actionType === "approve"
                            ? "bg-green-600 hover:bg-green-700"
                            : actionType === "reject"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-orange-500 hover:bg-orange-600"
                        }`}
                      >
                        تأكيد الإجراء
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminListingsPage;
