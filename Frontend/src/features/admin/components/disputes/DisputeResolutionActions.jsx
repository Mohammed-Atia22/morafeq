import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DisputeResolutionDialog,
  canResolveDispute,
} from "./DisputeResolutionDialog";

export function DisputeResolutionActions({
  dispute,
  onResolved,
  layout = "card",
}) {
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionType, setResolutionType] = useState(null);

  if (!canResolveDispute(dispute)) {
    return null;
  }

  const openModal = (type) => {
    setSelectedDispute(dispute);
    setResolutionType(type);
  };

  const closeModal = () => {
    setSelectedDispute(null);
    setResolutionType(null);
  };

  const buttonClass =
    layout === "detail"
      ? "rounded-xl px-5 py-2.5 text-xs font-black text-white transition"
      : "rounded-xl py-2.5 text-xs font-black text-white shadow-sm transition";

  return (
    <>
      <div
        className={
          layout === "detail"
            ? "flex flex-wrap gap-2"
            : "grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2"
        }
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => openModal("REFUND")}
          className={`${buttonClass} bg-red-600 hover:bg-red-700`}
        >
          قبول الاسترجاع
        </button>
        <button
          type="button"
          onClick={() => openModal("RELEASE")}
          className={`${buttonClass} bg-emerald-600 hover:bg-emerald-700`}
        >
          رفض الشكوى وصرف المبالغ
        </button>
      </div>

      <DisputeResolutionDialog
        open={Boolean(selectedDispute)}
        dispute={selectedDispute}
        resolutionType={resolutionType}
        onClose={closeModal}
        onResolved={onResolved}
      />
    </>
  );
}

export function DisputeCardActions({ dispute, onResolved }) {
  const bookingId = dispute.bookingId ?? dispute.id;

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          to={`/admin/disputes/${bookingId}`}
          className="text-xs font-bold text-[#1752F0] hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          عرض التفاصيل
        </Link>
      </div>
      <DisputeResolutionActions
        dispute={dispute}
        onResolved={onResolved}
        layout="card"
      />
    </div>
  );
}
