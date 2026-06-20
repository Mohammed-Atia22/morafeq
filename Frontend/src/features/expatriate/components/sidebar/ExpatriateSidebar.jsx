import {
useCallback,
useEffect,
useState,
} from "react";
import {
NavLink,
useLocation,
useNavigate,
} from "react-router-dom";

import { useAuth } from "../../../auth/hooks/useAuth";
import { chatApi } from "../../../chat/services/chatApi";
import { VerificationBadge } from "../../../verification/components/VerificationBadge";

const NAV_ITEMS = [
{
to: "/expatriate",
end: true,
label: "الرئيسية",
icon: ( <svg
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     className="h-5 w-5"
   > <path
       strokeLinecap="round"
       strokeLinejoin="round"
       d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
     /> </svg>
),
},
{
to: "/expatriate/search",
end: false,
label: "البحث",
icon: ( <svg
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     className="h-5 w-5"
   > <path
       strokeLinecap="round"
       strokeLinejoin="round"
       d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
     /> </svg>
),
},
{
to: "/expatriate/bookings",
end: false,
label: "حجوزاتي",
icon: ( <svg
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     className="h-5 w-5"
   > <path
       strokeLinecap="round"
       strokeLinejoin="round"
       d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
     /> </svg>
),
},

// الرسائل
{
to: "/expatriate/messages",
end: false,
label: "الرسائل",
icon: ( <svg
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     className="h-5 w-5"
   > <path
       strokeLinecap="round"
       strokeLinejoin="round"
       d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9 9.7 9.7 0 01-4-.9L3 21l.9-5A9 9 0 1121 12z"
     /> </svg>
),
},

{
to: "/dispute-chat",
end: false,
label: "محادثات النزاع",
icon: ( <svg
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     className="h-5 w-5"
   > <path
       strokeLinecap="round"
       strokeLinejoin="round"
       d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
     /> </svg>
),
},

{
to: "/expatriate/profile",
end: false,
label: "ملفي",
icon: ( <svg
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     className="h-5 w-5"
   > <path
       strokeLinecap="round"
       strokeLinejoin="round"
       d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
     /> </svg>
),
},
];

export function ExpatriateSidebar() {
const { user, logout } = useAuth();
const navigate = useNavigate();
const location = useLocation();

const [unreadMessagesCount, setUnreadMessagesCount] =
useState(0);

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
      total +
      Number(conversation.unreadCount ?? 0),
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


// تحديث دوري لو وصلت رسالة والمستخدم مش فاتح الشات
const intervalId = window.setInterval(
  loadUnreadMessagesCount,
  10000,
);

// تحديث لما المستخدم يرجع للنافذة
const handleWindowFocus = () => {
  loadUnreadMessagesCount();
};

// تحديث فور تعليم الرسائل كمقروءة
const handleUnreadChanged = () => {
  loadUnreadMessagesCount();
};

window.addEventListener(
  "focus",
  handleWindowFocus,
);

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

return (
<> <div className="border-b border-slate-200 p-4">
<button
type="button"
onClick={() =>
navigate("/expatriate/profile")
}
className="flex w-full items-center gap-3 rounded-xl bg-[#eef3ff] p-3 transition hover:bg-blue-200"
> <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0b62d8] text-lg font-black text-white">
{user?.firstName?.[0] || "ط"} </div>


      <div className="text-left">
        <p className="text-sm font-black text-[#172033]">
          {[user?.firstName, user?.lastName]
            .filter(Boolean)
            .join(" ") || "الطالب"}
        </p>

        <p className="text-xs font-semibold text-blue-500">
          طالب مغترب
        </p>

        <div className="mt-2">
          <VerificationBadge status={user?.verificationStatus} compact />
        </div>
      </div>
    </button>
  </div>

  <nav className="flex-1 space-y-2 px-3 py-4">
    {NAV_ITEMS.map(
      ({ to, end, label, icon }) => {
        const isMessagesItem =
          to === "/expatriate/messages";

        const showUnreadBadge =
          isMessagesItem &&
          unreadMessagesCount > 0;

        const displayedUnreadCount =
          unreadMessagesCount > 99
            ? "99+"
            : unreadMessagesCount;

        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? "bg-[#E8F0FF] text-[#0b62d8]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? "text-[#0b62d8]"
                      : "text-slate-400"
                  }
                >
                  {icon}
                </span>

                <span>{label}</span>

                {showUnreadBadge && (
                  <span className="mr-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {displayedUnreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      },
    )}
  </nav>

  <div className="border-t border-slate-200 p-4">
    <button
      type="button"
      onClick={logout}
      className="w-full text-center text-sm font-bold text-red-500 hover:text-red-600"
    >
      تسجيل الخروج
    </button>
  </div>
</>


);
}
