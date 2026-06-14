import { useRef } from "react";

export function AvatarUploader({ avatarUrl, firstName, loading, onUpload }) {
  const inputRef = useRef(null);

  const initials = firstName?.charAt(0)?.toUpperCase() ?? "م";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-5">
      {/* Avatar */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="الصورة الشخصية"
            className="h-20 w-20 rounded-full object-cover ring-4 ring-[#EEF3FF]"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#1752F0] text-2xl font-black text-white ring-4 ring-[#EEF3FF]">
            {initials}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* Camera button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute -bottom-1 -left-1 grid h-7 w-7 place-items-center rounded-full bg-[#1752F0] shadow-md ring-2 ring-white transition hover:bg-[#1240c4] disabled:opacity-50"
          aria-label="تغيير الصورة"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Text */}
      <div dir="rtl">
        <p className="text-sm font-bold text-[#0f172a]">الصورة الشخصية</p>
        <p className="mt-0.5 text-xs text-slate-400">
          JPG أو PNG · الحد الأقصى 5MB
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="mt-2 text-xs font-bold text-[#1752F0] transition hover:text-[#1240c4] disabled:opacity-50"
        >
          {loading ? "جاري الرفع..." : "تغيير الصورة"}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}