import { createContext, useContext, useState, useEffect } from "react";
import { refresh } from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await refresh();
        setAccessToken(res.data.accessToken);

        const userData = res.data.user;

        // Normalize avatar / image key so refreshes never lose the Cloudinary URL
        if (userData) {
          const avatarUrl = userData.image || userData.avatar;
          setUser({
            ...userData,
            avatar: avatarUrl,
            image: avatarUrl,
          });
        }
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{ accessToken, setAccessToken, user, setUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
