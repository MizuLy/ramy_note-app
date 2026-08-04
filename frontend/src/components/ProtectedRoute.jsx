import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!accessToken) return <Navigate to="/login" />;

  return children;
}
