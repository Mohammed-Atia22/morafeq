import { Outlet } from "react-router-dom";
import { AppNavbar } from "../../shared/components/navigation/AppNavbar";
import { ExpatriateSidebar } from "../../features/expatriate/components/sidebar/ExpatriateSidebar";

export default function ExpatriateLayout() {
  return (
    <>
      <AppNavbar />

      <div dir="rtl" className="flex min-h-screen bg-[#F4F7FE] pt-[68px]">
        
        {/* Fixed sidebar on the right */}
        <aside className="fixed inset-y-0 right-0 z-30 hidden w-[220px] border-l border-slate-200 bg-white lg:flex lg:flex-col overflow-y-auto">
          <ExpatriateSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 py-6 lg:mr-[220px]">
          <Outlet />
        </main>
        
      </div>
    </>
  );
}