import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { AppNavbar } from "../../shared/components/navigation/AppNavbar";
import { AdminSidebar } from "../../features/admin/components/AdminSidebar";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      <AppNavbar />
      <div dir="rtl" className="flex min-h-screen bg-slate-50 pt-[68px]">
        {/* Fixed sidebar on the right */}
        <aside className="fixed inset-y-0 right-0 z-30 hidden w-[240px] border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-y-auto">
          <AdminSidebar user={user} logout={logout} />
        </aside>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed right-4 top-[84px] z-30 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          aria-label="فتح قائمة الإدارة"
          aria-expanded={isSidebarOpen}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق قائمة الإدارة"
            />
            <aside className="absolute inset-y-0 right-0 flex w-[min(86vw,280px)] flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-end border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="إغلاق قائمة الإدارة"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AdminSidebar user={user} logout={logout} onNavigate={() => setIsSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main content pushed left of sidebar */}
        <main className="flex-1 min-w-0 bg-slate-50 lg:mr-[240px]">
          <Outlet context={{ user, logout }} />
        </main>
      </div>
    </>
  );
}
