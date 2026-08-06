import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SearchModal from "../components/modals/SearchModal";

export default function AdminLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <Outlet />
      <SearchModal />
    </div>
  );
}
