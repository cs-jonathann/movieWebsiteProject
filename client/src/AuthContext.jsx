// client/src/AuthContext.jsx

import React, { createContext, useContext, useState, useCallback } from "react";

// make a Context object we can share with the app
const AuthContext = createContext(null);

// custom hook so components can do: const auth = useAuth();
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

// on first load, read from localStorage so refresh keeps you logged in
function loadStoredAuth() {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (storedToken && storedUser) {
    try {
      return { token: storedToken, user: JSON.parse(storedUser) };
    } catch {
      // if JSON.parse fails, clear corrupted data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
  return { token: null, user: null };
}

// provider component that wraps the whole app in main.jsx
export function AuthProvider({ children }) {
  // { token, user } -> both null if not logged in
  const [auth, setAuth] = useState(loadStoredAuth);

  // called after a successful login/register
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setAuth({ token: newToken, user: newUser });
  }, []);

  // logout → clear everything
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
  }, []);

  // value that any component can read
  const value = {
    user: auth.user,
    token: auth.token,
    login,
    logout,
    isLoggedIn: !!auth.token, // convenient boolean flag
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
