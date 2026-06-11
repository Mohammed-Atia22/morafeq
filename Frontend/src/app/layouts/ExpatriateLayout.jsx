// import { Outlet } from "react-router-dom";
// import { ExpatriateSidebar } from "../../features/expatriate/components/sidebar/ExpatriateSidebar";

// export default function ExpatriateLayout() {
//   return (
//     <div className="relative min-h-screen bg-slate-50">
//       <ExpatriateSidebar />

//       <main className="mr-[220px] min-h-screen px-6 py-6">
//         <Outlet />
//       </main>
//     </div>
//   );
// }
import { Outlet } from "react-router-dom";
import { AppNavbar } from "../../shared/components/navigation/AppNavbar";
import { ExpatriateSidebar } from "../../features/expatriate/components/sidebar/ExpatriateSidebar";

export default function ExpatriateLayout() {
  return (
    <>
      <AppNavbar />
      <div dir="rtl" className="flex min-h-screen bg-[#F4F7FE] pt-[68px]">
        {/* Fixed sidebar on the right */}
        <ExpatriateSidebar />

        {/* Main content pushed left of sidebar */}
        <main className="mr-[220px] flex-1 min-w-0 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </>
  );
}
