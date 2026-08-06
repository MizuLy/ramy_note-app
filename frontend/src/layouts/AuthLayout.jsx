import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-900 text-white px-4">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
