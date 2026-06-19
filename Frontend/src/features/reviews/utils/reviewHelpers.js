export function getReviewerDisplayName(reviewer) {
  if (!reviewer) return "مجهول";
  const name = `${reviewer.firstName ?? ""} ${reviewer.lastName ?? ""}`.trim();
  return name || "مجهول";
}

export function getReviewerInitials(reviewer) {
  return reviewer?.firstName?.charAt(0)?.toUpperCase() ?? "م";
}

export function formatReviewDate(dateValue) {
  if (!dateValue) return null;
  return new Date(dateValue).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatReviewCount(count) {
  const total = Number(count) || 0;
  return `(${total.toLocaleString("ar-EG")} تقييم)`;
}
