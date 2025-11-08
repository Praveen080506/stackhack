import { createContext, useContext, useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('unauthorized');
        const me = await res.json();
        setUser({ id: me.id, email: me.email, role: me.role });
        setProfile(me);
      } catch (_) {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signUp = async (email, password, fullName, role = 'user', adminCode = null) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role, admin_code: adminCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser({ id: data.user.id, email: data.user.email, role: data.user.role });
      setProfile({ id: data.user.id, email: data.user.email, role: data.user.role, full_name: data.user.full_name });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser({ id: data.user.id, email: data.user.email, role: data.user.role });
      // fetch full profile
      const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${data.token}` } });
      const me = await meRes.json();
      setProfile(me);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const googleSignIn = async (idToken, opts = {}) => {
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken, role: opts.role, admin_code: opts.admin_code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser({ id: data.user.id, email: data.user.email, role: data.user.role });
      const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${data.token}` } });
      const me = await meRes.json();
      setProfile(me);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setProfile(null);
    return { error: null };
  };

  const updateProfile = async (updates) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API}/profiles/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setProfile(data);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    googleSignIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
