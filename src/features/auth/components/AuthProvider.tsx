import { useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import { AuthContext, type AuthContextType } from "../../../utils/AuthContext";
import { API_BASE_URL } from "../../../utils/constants";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/health/auth`, {
        withCredentials: true,
      });

      if (response.data.authorization === "ok") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
