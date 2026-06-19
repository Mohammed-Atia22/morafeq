import { useCallback, useEffect, useState } from "react";
import {
NavLink,
useLocation,
useNavigate,
} from "react-router-dom";

import {
BuildingIcon,
EyeIcon,
GridIcon,
MessageIcon,
PlusCircleIcon,
SettingsIcon,
UserIcon,
} from "../common/OwnerIcons";

import { chatApi } from './../../../chat/services/chatApi';
import { VerificationBadge } from "../../../verification/components/VerificationBadge";

function ClipboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

export function OwnerSidebar({ user, logout }) {
const navigate = useNavigate();
const location = useLocation();

const ownerSection =
location.state?.ownerSection || "listings";

const isOwnerHome =
location.pathname === "/owner";

const [unreadMessagesCount, setUnreadMessagesCount] =
useState(0);

const itemClassName = (active) =>
[
"flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-bold transition",
active
? "bg-[#e9f0ff] text-[#0b62d8]"
: "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]",
].join(" ");

const loadUnreadMessagesCount = useCallback(async () => {
if (!user?.id) {
setUnreadMessagesCount(0);
return;
}


try {
  const conversations =
    await chatApi.getConversations();

  const totalUnreadMessages = conversations.reduce(
    (total, conversation) =>
      total + Number(conversation.unreadCount ?? 0),
    0,
  );

  setUnreadMessagesCount(totalUnreadMessages);
} catch (error) {
  console.error(
    "Failed to load unread messages count:",
    error,
  );
}


}, [user?.id]);

useEffect(() => {
loadUnreadMessagesCount();


const intervalId = window.setInterval(
  loadUnreadMessagesCount,
  10000,
);

const handleWindowFocus = () => {
  loadUnreadMessagesCount();
};

const handleUnreadChanged = () => {
  loadUnreadMessagesCount();
};

window.addEventListener("focus", handleWindowFocus);

window.addEventListener(
  "chat-unread-changed",
  handleUnreadChanged,
);

return () => {
  window.clearInterval(intervalId);

  window.removeEventListener(
    "focus",
    handleWindowFocus,
  );

  window.removeEventListener(
    "chat-unread-changed",
    handleUnreadChanged,
  );
};


}, [
loadUnreadMessagesCount,
location.pathname,
]);

const showAddListing = () => {
navigate("/owner", {
state: {
ownerSection: "add",
ownerSectionKey: Date.now(),
},
});
};

return (
<> <div className="border-b border-slate-200 p-4">
<button
type="button"
onClick={() => navigate("/owner/profile")}
className="flex w-full items-center gap-3 rounded-xl bg-[#eef3ff] p-3 transition hover:bg-blue-200"
> <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0aa886] text-lg font-black text-white">
{user?.firstName?.[0] || "ك"} </div>


      <div className="text-left">
        <p className="text-sm font-black text-[#172033]">
          {[user?.firstName, user?.lastName]
            .filter(Boolean)
            .join(" ") || "كريم محمود"}
        </p>

        <p className="text-xs font-semibold text-emerald-500">
          مالك عقار
        </p>

        <div className="mt-2">
          <VerificationBadge status={user?.verificationStatus} compact />
        </div>
      </div>
    </button>
  </div>

  <nav className="flex-1 space-y-2 px-3 py-4">
    <SidebarNavItem
      to="/owner"
      state={{ ownerSection: "dashboard" }}
      label="لوحة التحكم"
      icon={GridIcon}
      active={
        isOwnerHome &&
        ownerSection === "dashboard"
      }
      className={itemClassName}
    />

    <SidebarNavItem
      to="/owner"
      state={{ ownerSection: "listings" }}
      label="عقاراتي"
      icon={BuildingIcon}
      active={
        isOwnerHome &&
        ownerSection !== "dashboard" &&
        ownerSection !== "add"
      }
      className={itemClassName}
    />

    {/* <SidebarNavItem
      to="/owner/bookings"
      label="طلبات المعاينة"
      icon={EyeIcon}
      badge="5"
      className={itemClassName}
    /> */}

    <SidebarNavItem
      to="/owner/rental-requests"
      label="طلبات الإيجار"
      icon={ClipboardIcon}
      className={itemClassName}
    />

    <button
      type="button"
      onClick={showAddListing}
      className={[
        "flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition",
        isOwnerHome && ownerSection === "add"
          ? "bg-[#e9f0ff] text-[#0b62d8]"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]",
      ].join(" ")}
    >
      <PlusCircleIcon className="h-5 w-5" />
      إضافة شقة
    </button>

    <SidebarNavItem
      to="/owner/messages"
      label="الرسائل"
      icon={MessageIcon}
      badge={
        unreadMessagesCount > 0
          ? unreadMessagesCount
          : undefined
      }
      danger
      className={itemClassName}
    />

    {/* <SidebarNavItem
      to="/owner/settings"
      label="الإعدادات"
      icon={SettingsIcon}
      className={itemClassName}
    /> */}

    <SidebarNavItem
      to="/owner/profile"
      label="ملفي"
      icon={UserIcon}
      className={itemClassName}
    />
  </nav>

  <div className="border-t border-slate-200 p-4">
    <button
      type="button"
      onClick={logout}
      className="w-full text-center text-sm font-bold text-red-500"
    >
      تسجيل الخروج
    </button>
  </div>
</>


);
}

function SidebarNavItem({
to,
state,
label,
icon: Icon,
badge,
danger = false,
active,
className,
}) {
const hasBadge =
badge !== undefined &&
badge !== null &&
Number(badge) > 0;

const displayedBadge =
Number(badge) > 99 ? "99+" : badge;

return (
<NavLink
to={to}
state={state}
aria-current={
active ? "page" : undefined
}
className={({ isActive }) =>
className(active ?? isActive)
}
> <span className="flex items-center gap-3"> <Icon className="h-5 w-5" />
{label} </span>


  {hasBadge ? (
    <span
      className={[
        "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black text-white",
        danger
          ? "bg-red-500"
          : "bg-amber-500",
      ].join(" ")}
    >
      {displayedBadge}
    </span>
  ) : null}
</NavLink>


);
}
