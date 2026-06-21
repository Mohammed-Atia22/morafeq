import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookingsApi } from "../services/bookingsApi";
import StaticMap from "../../../shared/components/maps/StaticMap";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    bookingsApi
      .getBookingDetail(id)
      .then((res) => {
        if (!mounted) return;
        setBooking(res);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load booking");
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-6">جارٍ التحميل...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!booking) return <div className="p-6">لا يوجد حجز</div>;

  const { listing } = booking;

  return (
    <main className="min-h-screen p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-medium">معلومات الحجز</h2>
          <div className="mt-3 text-sm text-slate-700 space-y-2">
            <p>
              <strong>العقار:</strong> {listing?.title}
            </p>
            <p>
              <strong>المدينة:</strong> {listing?.city} - {listing?.governorate}
            </p>
            <p>
              <strong>السعر المتفق عليه:</strong>{" "}
              {booking.agreedAmount ?? listing?.monthlyRent}{" "}
              {listing?.currency ?? "EGP"}
            </p>
            <p>
              <strong>حالة الحجز:</strong> {booking.status}
            </p>
            <p>
              <strong>حالة الدفع:</strong>{" "}
              {booking.payment?.status || "غير متوفر"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-medium">معلومات الوصول</h2>
          <div className="mt-3 text-sm text-slate-700">
            {listing?.streetName ? (
              <>
                <p>
                  <strong>العنوان:</strong> {listing.streetName}{" "}
                  {listing.buildingNumber
                    ? `، مبنى ${listing.buildingNumber}`
                    : ""}{" "}
                  {listing.apartmentNumber
                    ? `، شقة ${listing.apartmentNumber}`
                    : ""}
                </p>
                {listing.arrivalInstructions && (
                  <p>
                    <strong>تعليمات الوصول:</strong>{" "}
                    {listing.arrivalInstructions}
                  </p>
                )}
                {listing.lat && listing.lng && (
                  <div className="mt-4">
                    <StaticMap
                      lat={Number(listing.lat)}
                      lng={Number(listing.lng)}
                      height="280px"
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-500">
                سيُعرض العنوان التفصيلي بعد إتمام الدفع.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-medium">التواصل</h2>
          <div className="mt-3 text-sm text-slate-700">
            {/* Show host contact when backend provided it or when payment is held and booking is check-in pending (fallback) */}
            {listing?.host?.phone ||
            (booking.payment?.status === "HELD" &&
              booking.status === "CHECK_IN_PENDING") ? (
              <>
                <p>
                  <strong>المضيف:</strong> {listing.host?.firstName}{" "}
                  {listing.host?.lastName}
                </p>
                <p>
                  <strong>الهاتف:</strong>{" "}
                  {listing.host?.phoneCountryCode ?? ""}{" "}
                  {listing.host?.phone ?? "---"}
                </p>
              </>
            ) : (
              <p className="text-slate-500">
                سيُعرض رقم التواصل بعد إتمام الدفع.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-slate-100"
          >
            العودة
          </button>
        </div>
      </div>
    </main>
  );
}
