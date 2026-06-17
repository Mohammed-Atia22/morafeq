import { Outlet } from "react-router-dom";
import { AppNavbar } from "../../shared/components/navigation/AppNavbar";

export default function Layout() {
  return (
    <div className="min-h-screen">
      <AppNavbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}