import { createContext, ReactNode, useContext } from "react";
import { User as SelectUser } from "@shared/schema";

type AuthContextType = {
  user: SelectUser;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user: SelectUser = {
    id: "default-user",
    username: "admin",
    role: "admin",
    password: "",
    createdAt: new Date(),
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}