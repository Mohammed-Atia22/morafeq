import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { OwnerSidebar } from "../../features/owner/components/sidebar/OwnerSidebar";

export default function OwnerLayout() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("listings");

  return (
    <div dir="rtl" className="min-h-screen bg-[#eef3ff]">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-[260px] border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-y-auto">
        <OwnerSidebar
          user={user}
          logout={logout}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </aside>

      <main className="flex-1 min-h-screen min-w-0 lg:mr-[260px] bg-white">
        <Outlet context={{ activeSection, setActiveSection, user, logout }} />
      </main>
    </div>
  );
}
