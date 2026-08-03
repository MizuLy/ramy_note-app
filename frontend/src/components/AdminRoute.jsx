import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  console.log("Current user in AdminRoute:", user);

  if (user?.role !== "ADMIN") return <Navigate to="/" />;

  return children;
}
