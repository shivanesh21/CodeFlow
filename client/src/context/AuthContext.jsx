import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, getProfile } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load/refresh, validate token and restore session
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await getProfile();
      if (data.success && data.user) {
        // Always refresh user from server to ensure latest data
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        // Invalid response - clear stale session
        clearSession();
      }
    } catch (error) {
      // Token is stale or user doesn't exist in DB → clear and redirect to login
      console.warn("Session expired or user not found. Clearing session.");
      clearSession();
    }

    setLoading(false);
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Login — saves user and token to state and localStorage
  const login = async (formData) => {
    const data = await loginUser(formData);

    if (!data.success) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);

    return data;
  };

  // Register — auto-login after successful registration
  const register = async (formData) => {
    const data = await registerUser(formData);

    if (!data.success) {
      throw new Error(data.message || "Registration failed");
    }

    // Auto-login after registration so user goes directly to dashboard
    if (data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  };

  // Logout — clear everything
  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);