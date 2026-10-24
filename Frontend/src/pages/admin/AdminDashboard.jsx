import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AnalyticsChart from "../../components/admin/AnalyticsChart";
import PhoneManager from "../../components/admin/PhoneManager";
import StatsCards from "../../components/admin/StatsCards";
import OrderList from "../../components/admin/OrderList";
import MessageList from "../../components/admin/MessageList";
import api from '@utils/api';

const AdminDashboard = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login');
    }
    if (authError) {
      toast.error(authError);
    }
  }, [user, authLoading, authError, navigate]);

  // Handle window resize with debouncing
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile) {
          setSidebarOpen(false);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [activeView, isMobile]);

  // Fetch orders and messages
  const fetchData = useCallback(async (retries = 3, delay = 1000) => {
    setIsLoading(true);
    setError(null);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const [ordersResponse, messagesResponse] = await Promise.all([
          api.get('/orders/'),
          api.get('/contact-messages/')
        ]);
        
        // FIX: Extract the orders array from the API response
        const ordersData = Array.isArray(ordersResponse.data) 
          ? ordersResponse.data 
          : ordersResponse.data?.results || ordersResponse.data?.data || [];
        
        const messagesData = Array.isArray(messagesResponse.data)
          ? messagesResponse.data
          : messagesResponse.data?.results || messagesResponse.data?.data || [];
        
        setOrders(ordersData);
        setMessages(messagesData);
        setIsLoading(false);
        
        console.log('Data fetched successfully:', { 
          orders: ordersData, 
          messages: messagesData,
          ordersCount: ordersData.length,
          messagesCount: messagesData.length
        });
        return;
      } catch (error) {
        if (attempt < retries) {
          console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        setError('Failed to load data. Please try again.');
        toast.error('Failed to load dashboard data.');
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [fetchData, user, authLoading]);

  // Memoized renderMainContent
  const renderMainContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg"
        >
          <p>{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </motion.div>
      );
    }

    switch (activeView) {
      case 'phones':
        return <PhoneManager />;
      case 'analytics':
        return <AnalyticsChart />;
      case 'dashboard':
      default:
        return (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6 shadow-sm sm:shadow-md"
            >
              <h2 className="text-xl sm:text-2xl font-bold">Welcome back!</h2>
              <p className="opacity-90 text-sm sm:text-base">Here's what's happening with your store today.</p>
            </motion.div>

            <StatsCards orders={orders} messages={messages} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg sm:rounded-xl shadow-xs sm:shadow-sm p-4 sm:p-6 lg:col-span-2"
              >
                <h3 className="text-lg font-semibold mb-3 sm:mb-4">Recent Orders</h3>
                <OrderList initialOrders={orders} />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg sm:rounded-xl shadow-xs sm:shadow-sm p-4 sm:p-6"
              >
                <h3 className="text-lg font-semibold mb-3 sm:mb-4">New Messages</h3>
                <MessageList initialMessages={messages} />
              </motion.div>
            </div>
          </>
        );
    }
  }, [activeView, isLoading, error, orders, messages, fetchData]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  return (
    <motion.div className="flex h-screen bg-gray-50">
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <FiX className="text-gray-800 text-xl" /> : <FiMenu className="text-gray-800 text-xl" />}
      </button>

      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleSidebar}
          />
        )}
        
        <motion.div
          initial={{ x: isMobile ? -300 : 0 }}
          animate={{ x: sidebarOpen || !isMobile ? 0 : (isMobile ? -300 : 0) }}
          exit={{ x: isMobile ? -300 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed md:relative z-50 h-full w-64 ${!sidebarOpen && isMobile ? 'hidden' : 'block'}`}
        >
          <AdminSidebar 
            activeView={activeView} 
            setActiveView={setActiveView}
            onNavigate={() => isMobile && setSidebarOpen(false)}
          />
        </motion.div>
      </AnimatePresence>
      
      <div className="flex-1 overflow-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-xs sm:shadow-sm p-3 sm:p-4"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {activeView === 'dashboard' && 'Dashboard'}
            {activeView === 'phones' && 'Phone Management'}
            {activeView === 'analytics' && 'Analytics'}
          </h1>
        </motion.header>

        <motion.main className="p-3 sm:p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;