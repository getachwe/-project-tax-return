import React, { useEffect, useState } from "react";
import { AuthPanel } from "./AuthPanel";

export const AuthLanding: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
    const onStorage = () => setToken(localStorage.getItem("authToken"));
    const onLoggedIn: EventListener = () => onStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:loggedIn", onLoggedIn);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:loggedIn", onLoggedIn);
    };
  }, []);

  if (token) return null;
  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md">
        <AuthPanel />
      </div>
    </div>
  );
};
