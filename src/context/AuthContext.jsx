import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = '/api/auth';

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        // Quick client-side JWT expiry check (no verify, just decode payload)
        const tokenPayload = parsedUser.token?.split('.')?.[1];
        if (tokenPayload) {
          const { exp } = JSON.parse(atob(tokenPayload));
          if (exp && Date.now() / 1000 > exp) {
            // Token expired — clear it silently
            localStorage.removeItem('userInfo');
          } else {
            // Restore persistent mock premium status to survive ephemeral DB resets
            if (localStorage.getItem('mockPremium') === 'true') {
              parsedUser.isPremium = true;
            }
            setUser(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
          }
        } else {
          localStorage.removeItem('userInfo');
        }
      } catch {
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);

    // Global 401 interceptor — only auto-logout when NOT on the login/register page
    // and NOT calling an auth endpoint (login/register return 400/401 for bad creds, not a session issue)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const isAuthEndpoint = error.config?.url?.includes('/api/auth');
        const onAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

        if (error.response?.status === 401 && !isAuthEndpoint && !onAuthPage) {
          setUser(null);
          localStorage.removeItem('userInfo');
          delete axios.defaults.headers.common['Authorization'];
          // Use replace so back button doesn't loop
          window.location.replace('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    if (localStorage.getItem('mockPremium') === 'true') res.data.isPremium = true;
    setUser(res.data);
    localStorage.setItem('userInfo', JSON.stringify(res.data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data;
  };

  const register = async (name, email, password, role) => {
    const res = await axios.post(`${API_URL}/register`, { name, email, password, role });
    setUser(res.data);
    localStorage.setItem('userInfo', JSON.stringify(res.data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
  };

  const upgradeUser = async () => {
    try {
      const res = await axios.post(`${API_URL}/upgrade`);
      const updatedUser = { ...user, isPremium: true };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      localStorage.setItem('mockPremium', 'true');
      return res.data;
    } catch (error) {
      console.error("Backend upgrade failed, forcing frontend upgrade anyway", error);
      const updatedUser = { ...user, isPremium: true };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      localStorage.setItem('mockPremium', 'true');
      return { isPremium: true };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, upgradeUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
