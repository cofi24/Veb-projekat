import { createContext, useContext, useState } from "react";
import {jwtDecode} from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  const login = (jwtToken) => {
    try {
      const decoded = jwtDecode(jwtToken);

      const username = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      setUser({ username, role });
      setToken(jwtToken);
    } catch (error) {
      console.error("Greška pri dekodiranju tokena:", error);
      logout(); // Ako nešto krene po zlu, očisti stanje
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
