import { createContext, useEffect, useState } from 'react';
import { getToken, saveToken, removeToken } from '../utils/authStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await getToken();
      if (storedToken) setToken(storedToken);
      setLoading(false);
    };
    loadToken();
  }, []);

  const login = async (jwtToken) => {
    await saveToken(jwtToken);
    setToken(jwtToken);
  };

  const logout = async () => {
    await removeToken();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
