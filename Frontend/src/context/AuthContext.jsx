import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }

      setLoading(true);
      const response = await api.get('/auth/me/');
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('token');
      setUser(null);
      setError('Authentication failed');
      toast.error('Authentication failed. Please log in again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login/', credentials);
      if (!response.data.token) {
        throw new Error('No token received');
      }

      localStorage.setItem('token', response.data.token);
      const userData = await checkAuth();

      if (!userData?.is_superuser) {
        localStorage.removeItem('token');
        setUser(null);
        throw new Error('Admin privileges required');
      }

      const redirectTo = location.state?.from?.pathname || '/admin';
      navigate(redirectTo, { replace: true });
      toast.success('Logged in successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/logout/');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed, but clearing session.');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      navigate('/admin/login', { state: { from: location }, replace: true });
      toast.info('Logged out successfully');
    }
  };

  // Check auth on mount
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
    };
    verifyAuth();
  }, [checkAuth]); // Removed location from dependencies

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};