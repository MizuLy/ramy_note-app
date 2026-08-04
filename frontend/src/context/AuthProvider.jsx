import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
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
        setUser(res.data.user);
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
