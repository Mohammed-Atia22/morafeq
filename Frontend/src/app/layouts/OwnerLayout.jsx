import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { AppNavbar } from "../../shared/components/navigation/AppNavbar";
import { OwnerSidebar } from "../../features/owner/components/sidebar/OwnerSidebar";

export default function OwnerLayout() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("listings");

  return (
    <>
      <AppNavbar />
      <div dir="rtl" className="flex min-h-screen bg-[#eef3ff] pt-[68px]">
        {/* Fixed sidebar on the right */}
        <aside className="fixed inset-y-0 right-0 z-30 hidden w-[260px] border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-y-auto">
          <OwnerSidebar
            user={user}
            logout={logout}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </aside>

        {/* Main content pushed left of sidebar */}
        <main className="mr-[260px] flex-1 min-w-0 px-6 py-6 bg-white">
          <Outlet context={{ activeSection, setActiveSection, user, logout }} />
        </main>
      </div>
    </>
  );
}
