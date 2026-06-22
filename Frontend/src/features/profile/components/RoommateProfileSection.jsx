import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../services/usersApi";

export function RoommateProfileSection({ profile, onSaved }) {
  const navigate = useNavigate();
  const [roommateProfile, setRoommateProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await usersApi.getMyRoommateProfile();
        if (!mounted) return;
        setRoommateProfile(resp);
      } catch (e) {
        if (mounted) {
          setError(e.message || "فشل في تحميل بيانات التوافق");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  const isCompleted = roommateProfile?.isCompleted;
  const profileData = roommateProfile?.profile;

  return (
    <div
      dir="rtl"
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#0f172a]">
            بيانات توافق الزملاء
          </h2>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="grid gap-4">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : !isCompleted ? (
          <div className="rounded-xl bg-[#FEF3C7] ring-1 ring-amber-200 px-4 py-3">
            <h3 className="text-sm font-black text-[#0f172a]">
              أكمل بيانات توافق الزملاء
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              أكمل بيانات توافق الزملاء للحصول على ترشيحات أدق للسكن والزملاء.
            </p>
            <button
              type="button"
              onClick={() => {
                navigate("/expatriate/profile/roommate-profile");
              }}
              className="mt-3 rounded-xl bg-[#1752F0] px-4 py-2 text-sm font-black text-white"
            >
              أكمل بيانات التوافق
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3">
            <h3 className="text-sm font-black text-[#0f172a]">
              بيانات التوافق مكتملة
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              تم إكمال بيانات توافق الزملاء بنجاح.
            </p>
            <button
              type="button"
              onClick={() => {
                navigate("/expatriate/profile/roommate-profile");
              }}
              className="mt-3 rounded-xl bg-[#1752F0] px-4 py-2 text-sm font-black text-white"
            >
              تعديل بيانات التوافق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
