import roomOne from "../../../../images/rooms (1).jpg";
import roomTwo from "../../../../images/rooms (2).jpg";
import roomThree from "../../../../images/rooms (3).jpg";

export const statusTabs = [
  { key: "all", label: "الكل" },
  { key: "draft", label: "مسودة" },
  { key: "active", label: "نشط" },
  { key: "rented", label: "مؤجر" },
  { key: "archived", label: "مؤرشف" },
];

export const statusMeta = {
  ACTIVE: {
    label: "نشط",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    filter: "active",
    accent: "emerald",
  },
  APPROVED: {
    label: "نشط",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    filter: "active",
    accent: "emerald",
  },
  RESERVED: {
    label: "محجوز بانتظار الدفع",
    dot: "bg-blue-500",
    text: "text-blue-600",
    filter: "rented",
    accent: "blue",
  },
  INACTIVE: {
    label: "مؤجر",
    dot: "bg-violet-500",
    text: "text-violet-600",
    filter: "rented",
    accent: "violet",
  },
  DRAFT: {
    label: "مسودة",
    dot: "bg-slate-400",
    text: "text-slate-500",
    filter: "draft",
    accent: "slate",
  },
  PENDING_APPROVAL: {
    label: "قيد المراجعة",
    dot: "bg-amber-400",
    text: "text-amber-600",
    filter: "draft",
    accent: "amber",
  },
  REJECTED: {
    label: "مرفوض",
    dot: "bg-red-500",
    text: "text-red-600",
    filter: "archived",
    accent: "red",
  },
  SUSPENDED: {
    label: "معلق",
    dot: "bg-red-500",
    text: "text-red-600",
    filter: "archived",
    accent: "red",
  },
};

export const fallbackImages = [roomOne, roomTwo, roomThree];
