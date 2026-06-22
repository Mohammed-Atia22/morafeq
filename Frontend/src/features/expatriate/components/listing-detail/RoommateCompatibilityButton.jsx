import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../../profile/services/usersApi";

export function RoommateCompatibilityButton({ listingId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      const resp = await usersApi.getMyRoommateProfile();
      setProfileCompleted(resp?.isCompleted || false);

      if (resp?.isCompleted) {
        // Profile completed, navigate to compatibility page
        navigate(`/expatriate/listings/${listingId}/roommate-compatibility`);
      } else {
        // Profile not completed, show modal
        setShowModal(true);
      }
    } catch (e) {
      console.error("Failed to check roommate profile:", e);
      // Show modal if profile check fails
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="group flex w-full items-center justify-between rounded-2xl bg-gradient-to-l from-[#1752F0] to-[#1240c4] px-5 py-4 text-white shadow-md transition hover:shadow-lg hover:from-[#1240c4] hover:to-[#0e35a8] disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <div dir="rtl" className="text-right">
            <p className="text-sm font-black">شوف الزملاء المناسبين ليك</p>
            <p className="text-xs text-white/70">
              تعرف على نسبة توافقك مع الشقة والزملاء الحاليين.
            </p>
          </div>
        </div>

        {/* Arrow */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="h-4 w-4 shrink-0 text-white/70 transition group-hover:translate-x-[-3px]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Modal for incomplete profile */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div
            dir="rtl"
            className="relative max-w-md w-full rounded-2xl bg-white shadow-2xl p-6"
          >
            <h3 className="text-lg font-black text-[#0f172a]">
              أكمل بيانات التوافق
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              علشان نقدر نحسب توافقك مع الشقة والزملاء، محتاجين منك بيانات بسيطة
              عن دراستك وميزانيتك ونمط حياتك.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  navigate("/expatriate/profile/roommate-profile");
                }}
                className="w-full rounded-xl bg-[#1752F0] px-4 py-2.5 text-sm font-black text-white"
              >
                أكمل بيانات التوافق
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
