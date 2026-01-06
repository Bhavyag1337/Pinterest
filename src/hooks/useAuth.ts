import { useState, useEffect, createContext, useContext } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("pinterest_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulated login - in production, this would call an API
    if (email && password.length >= 6) {
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        name: email.split("@")[0],
      };
      setUser(newUser);
      localStorage.setItem("pinterest_user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    // Simulated signup - in production, this would call an API
    if (email && password.length >= 6 && name) {
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        name,
      };
      setUser(newUser);
      localStorage.setItem("pinterest_user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pinterest_user");
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
  };
}
