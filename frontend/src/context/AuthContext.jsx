import { createContext, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false);

  const syncCurrentUser = async () => { 
    const { data } = await apiClient.get("/auth/me");
    setUser({
      id: data.user?.id || data.id,
      email: data.user?.email || data.email,
      role: data.user?.role || data.role
    });
  };

  useEffect(() => {  
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      setToken(data.token);
      setUser(data.user);
      await syncCurrentUser();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.response?.data?.message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post("/auth/register", payload);
      if (data.token) {
        localStorage.setItem("token", data.token);
        apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        setToken(data.token);
        setUser(data.user);
        await syncCurrentUser();
        return { ok: true };
      }

      return {
        ok: true,
        requiresEmailVerification: true,
        message: data.message || "Registration successful. Please verify your email."
      };
    } catch (error) {
      return { ok: false, message: error.response?.data?.message || "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token), isLoading, login, register, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
