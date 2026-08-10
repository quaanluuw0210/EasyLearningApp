import { useState, useEffect } from "react";

const ID_TOKEN_KEY = "bmi_id_token";
const GOOGLE_UID_KEY = "bmi_google_uid";

export const authStorage = {
  setIdToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ID_TOKEN_KEY, token);
    window.dispatchEvent(new Event("auth-change"));
  },
  getIdToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ID_TOKEN_KEY);
  },
  setGoogleUid(uid: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(GOOGLE_UID_KEY, uid);
    window.dispatchEvent(new Event("auth-change"));
  },
  getGoogleUid() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(GOOGLE_UID_KEY);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_UID_KEY);
    window.dispatchEvent(new Event("auth-change"));
  }
};

export function useAuth() {
  const [user, setUser] = useState<{ idToken: string | null; googleUid: string | null }>({
    idToken: null,
    googleUid: null,
  });

  useEffect(() => {
    const checkAuth = () => {
      setUser({
        idToken: authStorage.getIdToken(),
        googleUid: authStorage.getGoogleUid(),
      });
    };

    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const isLoggedIn = !!(user.idToken || user.googleUid);

  return { ...user, isLoggedIn, logout: authStorage.clear };
}
