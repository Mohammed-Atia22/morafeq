import { useState } from "react";
import { RatingStars } from "./RatingStars";
import {
  formatReviewDate,
  getReviewerDisplayName,
  getReviewerInitials,
} from "../utils/reviewHelpers";

export function ReviewCard({
  review,
  currentUserId,
  onDelete,
  deleting = false,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!review) return null;

  const name = getReviewerDisplayName(review.reviewer);
  const initials = getReviewerInitials(review.reviewer);
  const date = formatReviewDate(review.createdAt);
  const isOwner = currentUserId != null && review.reviewerId === currentUserId;

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete(review.id);
    setConfirmDelete(false);
  };

  return (
    <article className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        {review.reviewer?.avatarUrl ? (
          <img
            src={review.reviewer.avatarUrl}
            alt={name}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-100"
          />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEF3FF] text-sm font-bold text-[#1752F0]">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[#0f172a]">{name}</p>
              <RatingStars rating={review.rating} size="sm" className="mt-1" />
            </div>
            {date && <p className="shrink-0 text-xs text-slate-400">{date}</p>}
          </div>

          {review.comment && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {review.comment}
            </p>
          )}

          {isOwner && onDelete && (
            <div className="mt-3">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  className="text-xs font-bold text-red-500 transition hover:text-red-600 disabled:opacity-60"
                >
                  حذف التقييم
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">هل أنت متأكد؟</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? "جاري الحذف..." : "تأكيد الحذف"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="rounded-lg px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
