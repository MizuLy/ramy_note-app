import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SearchModal from "../components/modals/SearchModal";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Sidebar stays mounted persistently here */}
      <Sidebar />

      {/* Dynamic page contents render inside Outlet */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Global Modals */}
      <SearchModal />
    </div>
  );
}
