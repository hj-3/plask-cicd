import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('plask_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem('plask_token') || ''
  );

  const login = (userData, jwtToken) => {
    localStorage.setItem('plask_user', JSON.stringify(userData));
    localStorage.setItem('plask_token', jwtToken);
    setUser(userData);
    setToken(jwtToken);
  };

  const logout = async () => {
    try {
      const storedToken = localStorage.getItem('plask_token');
      if (storedToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${storedToken}` },
        });
      }
    } catch (_) {}
    localStorage.removeItem('plask_user');
    localStorage.removeItem('plask_token');
    setUser(null);
    setToken('');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoggedIn: !!user,
        isAdmin: user?.isAdmin || false,
        userId: user?.id || null,
        userEmail: user?.email || '',
        userName: user?.name || '',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
