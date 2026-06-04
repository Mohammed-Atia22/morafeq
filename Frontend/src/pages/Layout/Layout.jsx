import { Outlet } from "react-router-dom";
import { AppNavbar } from "../../components/layout/AppNavbar";

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