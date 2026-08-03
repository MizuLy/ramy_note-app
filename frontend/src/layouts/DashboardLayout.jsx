import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SearchModal from "../components/modals/SearchModal";

export default function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
      <SearchModal />
    </div>
  );
}
