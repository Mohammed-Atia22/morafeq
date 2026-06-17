import { Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { AppNavbar } from "../../shared/components/navigation/AppNavbar";
import { AdminSidebar } from "../../features/admin/components/AdminSidebar";

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <AppNavbar />
      <div dir="rtl" className="flex min-h-screen bg-slate-50 pt-[68px]">
        {/* Fixed sidebar on the right */}
        <aside className="fixed inset-y-0 right-0 z-30 hidden w-[240px] border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-y-auto">
          <AdminSidebar user={user} logout={logout} />
        </aside>

        {/* Main content pushed left of sidebar */}
        <main className="mr-[240px] flex-1 min-w-0 bg-slate-50">
          <Outlet context={{ user, logout }} />
        </main>
      </div>
    </>
  );
}
