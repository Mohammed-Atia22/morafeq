import { Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { AppNavbar } from "../../shared/components/navigation/AppNavbar";
import { OwnerSidebar } from "../../features/owner/components/sidebar/OwnerSidebar";

export default function OwnerLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <AppNavbar />
      <div dir="rtl" className="flex min-h-screen bg-[#eef3ff] pt-[68px]">
        {/* Fixed sidebar on the right */}
        <aside className="fixed inset-y-0 right-0 z-30 hidden w-[260px] border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-y-auto">
          <OwnerSidebar
            user={user}
            logout={logout}
          />
        </aside>

        {/* Main content pushed left of sidebar */}
        <main className="flex-1 min-w-0 bg-white px-4 py-4 sm:px-6 sm:py-6 lg:mr-[260px]">
          <Outlet context={{ user, logout }} />
        </main>
      </div>
    </>
  );
}
