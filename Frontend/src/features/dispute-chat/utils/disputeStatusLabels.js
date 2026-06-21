const STATUS_LABELS = {
  DISPUTED: "نزاع قائم",
  CANCELLED_AFTER_DISPUTE: "ملغي بعد النزاع",
  DISPUTE_RESOLVED_FOR_HOST: "تم حل النزاع لصالح المالك",
  COMPLETED: "مكتمل",
  CHECK_IN_PENDING: "بانتظار الدخول",
  PENDING_PAYMENT: "بانتظار الدفع",
  PENDING_HOST_APPROVAL: "بانتظار موافقة المالك",
  REFUNDED: "تم الاسترداد",
};

const STATUS_CLASSES = {
  DISPUTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED_AFTER_DISPUTE: "bg-slate-50 text-slate-600 border-slate-200",
  DISPUTE_RESOLVED_FOR_HOST: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
};

export function getDisputeStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "غير معروف";
}

export function getDisputeStatusClass(status) {
  return (
    STATUS_CLASSES[status] ??
    "bg-slate-50 text-slate-600 border border-slate-200"
  );
}

export function isUnresolvedDispute(status) {
  return status === "DISPUTED" || status === "DISPUTE_RESOLVED_FOR_HOST";
}
