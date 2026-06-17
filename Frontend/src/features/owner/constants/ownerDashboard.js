import roomOne from "../../../../images/rooms (1).jpg";
import roomTwo from "../../../../images/rooms (2).jpg";
import roomThree from "../../../../images/rooms (3).jpg";

export const statusTabs = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "rented", label: "Rented" },
  { key: "archived", label: "Archived" },
];

export const statusMeta = {
  ACTIVE: {
    label: "Active",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    filter: "active",
    accent: "emerald",
  },
  APPROVED: {
    label: "Active",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    filter: "active",
    accent: "emerald",
  },
  INACTIVE: {
    label: "Rented",
    dot: "bg-violet-500",
    text: "text-violet-600",
    filter: "rented",
    accent: "violet",
  },
  DRAFT: {
    label: "Draft",
    dot: "bg-slate-400",
    text: "text-slate-500",
    filter: "draft",
    accent: "slate",
  },
  PENDING_APPROVAL: {
    label: "Draft",
    dot: "bg-amber-400",
    text: "text-amber-600",
    filter: "draft",
    accent: "amber",
  },
  REJECTED: {
    label: "Archived",
    dot: "bg-red-500",
    text: "text-red-600",
    filter: "archived",
    accent: "red",
  },
  SUSPENDED: {
    label: "Archived",
    dot: "bg-red-500",
    text: "text-red-600",
    filter: "archived",
    accent: "red",
  },
};

export const fallbackImages = [roomOne, roomTwo, roomThree];
