import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la app, revisa si ya había una sesión guardada.
  useEffect(() => {
    (async () => {
      const savedUsername = await AsyncStorage.getItem("username");
      const savedToken = await AsyncStorage.getItem("authToken");
      if (savedUsername && savedToken) {
        setUsername(savedUsername);
      }
      setLoading(false);
    })();
  }, []);

  const signIn = async (user, password) => {
    const data = await authApi.login(user, password);
    await AsyncStorage.setItem("authToken", data.token);
    await AsyncStorage.setItem("username", data.username);
    setUsername(data.username);
  };

  const signUp = async (user, email, password, password2) => {
    const data = await authApi.register(user, email, password, password2);
    await AsyncStorage.setItem("authToken", data.token);
    await AsyncStorage.setItem("username", data.username);
    setUsername(data.username);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("username");
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
