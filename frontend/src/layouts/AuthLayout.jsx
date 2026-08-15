import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col justify-center items-center">
      <Outlet />
    </div>
  );
}
