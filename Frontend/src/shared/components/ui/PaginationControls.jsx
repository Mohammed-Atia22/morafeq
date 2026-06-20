export function PaginationControls({ meta, onPageChange, loading = false }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        type="button"
        disabled={loading || meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
      >
        السابق
      </button>
      <span className="text-xs font-semibold text-slate-500">
        صفحة {meta.page} من {meta.totalPages}
      </span>
      <button
        type="button"
        disabled={loading || meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
      >
        التالي
      </button>
    </div>
  );
}
