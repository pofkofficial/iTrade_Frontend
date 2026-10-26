import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiLoader } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Initialize error from query params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const sessionExpired = searchParams.get('session_expired');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    } else if (sessionExpired) {
      setError('Your session has expired. Please login again.');
    }
    
    // Clear query params after reading them
    if (searchParams.toString()) {
      navigate(window.location.pathname, { replace: true });
    }
  }, [navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await login(credentials);
      
      if (response?.token) {
        setLoginSuccess(true);
        navigate('/admin');
      } else {
        // Handle backend-specific error messages
        const errorMsg = response?.status === 403
          ? 'Access denied: Admin privileges required'
          : response?.message || 'Invalid credentials';
        setError(errorMsg);
      }
    } catch (err) {
      // Handle network or unexpected errors
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      if (!loginSuccess) {
        setIsLoading(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <motion.div
        initial={{ y: -20, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg relative"
      >
        {/* Success overlay */}
        {loginSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center rounded-xl"
          >
            <div className="text-center text-white">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-4xl mb-4"
              >
                ✓
              </motion.div>
              <h3 className="text-xl font-bold">Login Successful!</h3>
              <p>Redirecting to dashboard...</p>
            </div>
          </motion.div>
        )}

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-gray-600">Sign in to your dashboard</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 text-sm text-red-700 bg-red-100 rounded-lg"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Login;