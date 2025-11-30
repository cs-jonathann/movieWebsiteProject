// client/src/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";

// make a Context object we can share with the app
const AuthContext = createContext(null);

// custom hook so components can do: const auth = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}

// provider component that wraps the whole app in main.jsx
export function AuthProvider({ children }) {
  // user info (null if not logged in)
  const [user, setUser] = useState(null);
  // token string (null if not logged in)
  const [token, setToken] = useState(null);

  // on first load, read from localStorage so refresh keeps you logged in
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // if JSON.parse fails, clear corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // called after a successful login/register
  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // logout → clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // value that any component can read
  const value = {
    user,
    token,
    login,
    logout,
    isLoggedIn: !!token, // convenient boolean flag
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
