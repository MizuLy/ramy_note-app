import { useNavigate } from "react-router-dom";
import axios from "axios";
import { logout } from "../../api/axios";
import { useAuth } from "../../context/AuthProvider";

export default function Logout() {
  const { setAccessToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();

      console.log("Bye Bye!");
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setAccessToken(null);
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <button onClick={handleLogout} className="text-sm">
      Logout
    </button>
  );
}
