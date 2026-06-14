import roomOne from "../../../../images/rooms (1).jpg";
import roomTwo from "../../../../images/rooms (2).jpg";
import roomThree from "../../../../images/rooms (3).jpg";

export const statusTabs = [
  { key: "all", label: "الكل" },
  { key: "available", label: "متاحة" },
  { key: "rented", label: "مؤجرة" },
  { key: "pending", label: "قيد المعاينة" },
];

export const statusMeta = {
  ACTIVE: {
    label: "متاحة",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    filter: "available",
    accent: "emerald",
  },
  APPROVED: {
    label: "متاحة",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    filter: "available",
    accent: "emerald",
  },
  INACTIVE: {
    label: "مؤجرة",
    dot: "bg-violet-500",
    text: "text-violet-600",
    filter: "rented",
    accent: "violet",
  },
  DRAFT: {
    label: "مسودة",
    dot: "bg-slate-400",
    text: "text-slate-500",
    filter: "pending",
    accent: "amber",
  },
  PENDING_APPROVAL: {
    label: "قيد المعاينة",
    dot: "bg-amber-400",
    text: "text-amber-600",
    filter: "pending",
    accent: "amber",
  },
  REJECTED: {
    label: "مرفوضة",
    dot: "bg-red-500",
    text: "text-red-600",
    filter: "pending",
    accent: "amber",
  },
  SUSPENDED: {
    label: "موقوفة",
    dot: "bg-red-500",
    text: "text-red-600",
    filter: "pending",
    accent: "amber",
  },
};

export const fallbackImages = [roomOne, roomTwo, roomThree];
