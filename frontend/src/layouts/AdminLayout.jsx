import { Link, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <Outlet />
        <Link to="/">Back</Link>
      </main>
    </div>
  );
}
