import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== "ADMIN") return <Navigate to="/" />;

  return children;
}
