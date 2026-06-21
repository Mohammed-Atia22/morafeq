import React, { useEffect, useState } from "react";
import { usersApi } from "../services/usersApi";

export function PreferencesSection({ profile, onSaved, userId, readOnly }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // fallback options if API not available
  const FALLBACK = [
    {
      key: "lifestyle",
      title: "نمط الحياة",
      items: [
        { id: "non_smoker", label: "غير مدخن" },
        { id: "smoker", label: "مدخن" },
        { id: "early_riser", label: "يستيقظ مبكراً" },
        { id: "night_owl", label: "يسهر ليلاً" },
        { id: "quiet", label: "هادئ" },
        { id: "social", label: "اجتماعي" },
        { id: "clean_freak", label: "يحب النظافة" },
        { id: "pet_friendly", label: "محب للحيوانات" },
        { id: "no_pets", label: "لا يفضل الحيوانات" },
      ],
    },
    {
      key: "study_habits",
      title: "عادات الدراسة",
      items: [
        { id: "studies_at_home", label: "يدرس في المنزل" },
        { id: "studies_at_library", label: "يدرس في المكتبة" },
        { id: "group_study", label: "يفضل الدراسة الجماعية" },
      ],
    },
    {
      key: "interests",
      title: "الاهتمامات",
      items: [
        { id: "football", label: "كرة القدم" },
        { id: "gaming", label: "الألعاب الإلكترونية" },
        { id: "reading", label: "القراءة" },
        { id: "gym", label: "الجيم" },
        { id: "music", label: "الموسيقى" },
        { id: "cooking", label: "الطبخ" },
        { id: "traveling", label: "السفر" },
      ],
    },
    {
      key: "university",
      title: "الجامعة",
      items: [
        { id: "cairo_university", label: "جامعة القاهرة" },
        { id: "ain_shams_university", label: "جامعة عين شمس" },
        { id: "helwan_university", label: "جامعة حلوان" },
        { id: "german_university_cairo", label: "الجامعة الألمانية بالقاهرة" },
        {
          id: "american_university_cairo",
          label: "الجامعة الأمريكية بالقاهرة",
        },
      ],
    },
  ];

  // conflicts map: selecting one will unselect the opposite
  const CONFLICTS = {
    non_smoker: ["smoker"],
    smoker: ["non_smoker"],
    early_riser: ["night_owl"],
    night_owl: ["early_riser"],
    pet_friendly: ["no_pets"],
    no_pets: ["pet_friendly"],
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await usersApi.getPreferencesOptions();
        if (!mounted) return;
        if (resp && Array.isArray(resp) && resp.length > 0) {
          // expect resp to be categories with items { key,title,items }
          setOptions(resp);
        } else {
          setOptions(FALLBACK);
        }
      } catch (e) {
        setOptions(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // initialise selected from profile or from public userId
    let mounted = true;
    const loadPrefs = async () => {
      setLoading(true);
      try {
        let prefs = null;
        if (userId) {
          prefs = await usersApi.getUserPreferences(userId);
        } else if (profile && (profile.preferenceKeys || profile.preferences)) {
          prefs = profile.preferenceKeys || profile.preferences;
        } else {
          const resp = await usersApi.getMyPreferences();
          prefs = resp?.preferenceKeys || resp;
        }

        if (!mounted) return;
        const setObj = new Set();
        if (Array.isArray(prefs)) {
          prefs.forEach((p) => {
            if (typeof p === "string") setObj.add(p);
            else if (p?.id) setObj.add(p.id);
            else if (p?.key) setObj.add(p.key);
          });
        }
        setSelected(setObj);
      } catch (e) {
        // ignore — keep empty
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPrefs();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, userId]);

  const toggle = (id) => {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        // remove conflicts
        const conflicts = CONFLICTS[id] || [];
        conflicts.forEach((c) => next.delete(c));
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const keys = Array.from(selected);
      if (keys.length > 30) {
        setError("يجب ألا تتجاوز التفضيلات 30 عنصرًا.");
        setSaving(false);
        return;
      }

      const payload = { preferenceKeys: keys };
      await usersApi.updateMyPreferences(payload);
      setSuccess("تم حفظ التفضيلات بنجاح.");
      if (onSaved) onSaved();
      // refresh success message removal
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message || "فشل في حفظ التفضيلات");
    } finally {
      setSaving(false);
    }
  };

  // UI pieces
  const Chip = ({ item }) => {
    const isSelected = selected.has(item.id || item.key || item);
    return (
      <button
        type="button"
        onClick={() => toggle(item.id || item.key || item)}
        disabled={readOnly}
        className={`m-1 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
          isSelected
            ? "bg-[#1752F0] text-white shadow"
            : "bg-slate-50 text-slate-700 border border-slate-100"
        }`}
      >
        {item.label || item.title || item}
      </button>
    );
  };

  const hasAny = selected.size > 0;

  return (
    <div
      dir="rtl"
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#0f172a]">تفضيلاتي</h2>
          {!readOnly && (
            <div className="text-xs font-black text-[#1752F0]">
              ملف التفضيلات
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Roommate matching notice */}
        <div
          className={`${hasAny ? "bg-white" : "bg-[#FEF3C7] ring-1 ring-amber-200"} rounded-xl px-4 py-3`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-black text-[#0f172a]">
                ميزة توافق زملاء السكن
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                أضف تفضيلاتك الشخصية لتحسين نتائج توافق زملاء السكن والحصول على
                اقتراحات أكثر دقة.
              </p>
            </div>
            {!readOnly && !hasAny && (
              <button
                type="button"
                onClick={() => {
                  /* focus first chip by visual cue */
                }}
                className="rounded-xl bg-[#1752F0] px-3 py-1.5 text-xs font-black text-white"
              >
                إضافة التفضيلات
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <div className="space-y-4">
            {options.map((cat) => (
              <div key={cat.key} className="rounded-2xl bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-black text-[#0f172a]">
                  {cat.title}
                </h4>
                <div className="flex flex-wrap">
                  {(cat.items || []).map((item) => (
                    <Chip key={item.id || item.key || item.label} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {!hasAny && (
              <div className="rounded-2xl bg-slate-50 py-8 text-center text-sm font-semibold text-slate-500">
                لم تقم بإضافة أي تفضيلات بعد.
                {!readOnly && <div className="mt-3" />}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {!readOnly && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#1752F0] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ التفضيلات"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
