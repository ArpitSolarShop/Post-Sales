import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token and user on start
    const loadState = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Failed to load auth state", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  const login = async (email: string, pass: string) => {
    // In production, use EXPO_PUBLIC_BACKEND_URL
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    try {
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setUser(data.user);
        await SecureStore.setItemAsync('token', data.access_token);
        await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
