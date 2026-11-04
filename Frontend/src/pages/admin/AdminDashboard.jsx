import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AnalyticsChart from "../../components/admin/AnalyticsChart";
import PhoneManager from "../../components/admin/PhoneManager";
import AdminSummaryPanel from "../../components/admin/AdminSummaryPanel";
import OrderList from "../../components/admin/OrderList";
import MessageList from "../../components/admin/MessageList";
import PaymentReconciliation from "../../components/admin/PaymentReconciliation";
import BulkVariantEditor from "../../components/admin/BulkVariantEditor";
import CustomerManager from "../../components/admin/CustomerManager";
import DeliverySheet from "../../components/admin/DeliverySheet";
import StoreControls from "../../components/admin/StoreControls";
import SecurityAudit from "../../components/admin/SecurityAudit";
import GlobalSearch from "../../components/admin/GlobalSearch";
import CustomerInbox from "../../components/admin/CustomerInbox";
import api from '@utils/api';

const AdminDashboard = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [adminCounts, setAdminCounts] = useState({ orders_pending: 0, messages_new: 0, visitors_today: 0 });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login');
    if (authError) toast.error(authError);
  }, [user, authLoading, authError, navigate]);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile) setSidebarOpen(false);
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeoutId); };
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) setSidebarOpen(false);
  }, [activeView, isMobile]);

  // This parent intentionally fetches counts only. Orders/messages belong to their lists.
  useEffect(() => {
    if (!user || authLoading) return undefined;
    let alive = true;
    const loadCounts = async () => {
      try {
        const response = await api.get('/admin/counts/', { params: { _ts: Date.now() } });
        if (alive) setAdminCounts(response.data || { orders_pending: 0, messages_new: 0 });
      } catch (err) {
        console.warn('Unable to refresh admin counters:', err?.message || err);
      }
    };
    loadCounts();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadCounts();
    }, 10000);
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') loadCounts(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVisibilityChange); };
  }, [user, authLoading]);

  useEffect(() => {
    const pending = Number(adminCounts.orders_pending || 0);
    document.title = pending > 0 ? `(${pending}) iTrade Admin` : 'iTrade Admin';
    return () => { document.title = 'iTrade Admin'; };
  }, [adminCounts.orders_pending]);

  const toggleSidebar = useCallback(() => setSidebarOpen(value => !value), []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const renderMainContent = useCallback(() => {
    switch (activeView) {
      case 'phones': return <PhoneManager />;
      case 'analytics': return <AnalyticsChart />;
      case 'orders': return <OrderList />;
      case 'messages':
      case 'inbox': return <CustomerInbox />;
      case 'payments': return <PaymentReconciliation />;
      case 'variants': return <BulkVariantEditor />;
      case 'customers': return <CustomerManager />;
      case 'deliveries': return <DeliverySheet />;
      case 'security': return <SecurityAudit />;
      case 'store': return <StoreControls />;
      case 'dashboard':
      default:
        return (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6 shadow-sm sm:shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold">Welcome back!</h2>
              <p className="opacity-90 text-sm sm:text-base">Here's what's happening with your store today.</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/15 px-3 py-1">{adminCounts.orders_pending || 0} new orders</span>
                <span className="rounded-full bg-white/15 px-3 py-1">{adminCounts.messages_new || 0} new messages</span>
                <span className="rounded-full bg-white/15 px-3 py-1">{adminCounts.visitors_today || 0} visitors today</span>
              </div>
            </motion.div>
            <AdminSummaryPanel />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-lg sm:rounded-xl shadow-xs sm:shadow-sm p-4 sm:p-6 lg:col-span-2">
                <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2"><h3 className="text-lg font-semibold">Recent Orders</h3><button onClick={() => setActiveView('orders')} className="text-sm text-blue-600 hover:underline">View all</button></div>
                <OrderList compact />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-lg sm:rounded-xl shadow-xs sm:shadow-sm p-4 sm:p-6">
                <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2"><h3 className="text-lg font-semibold">New customer enquiries</h3><button onClick={() => setActiveView('inbox')} className="text-sm text-blue-600 hover:underline">View all</button></div>
                <MessageList compact />
              </motion.div>
            </div>
          </>
        );
    }
  }, [activeView, adminCounts]);

  if (authLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" /></div>;
  if (!user) return null;

  const pageTitles = { dashboard: 'Dashboard', phones: 'Phone Management', analytics: 'Analytics', orders: 'Orders', messages: 'Customer Inbox', inbox: 'Customer Inbox', payments: 'Payment Reconciliation', variants: 'Bulk Variant Editor', customers: 'Customers', deliveries: 'Delivery Sheet', security: 'Security & Audit', store: 'Store Controls' };

  return (
    <motion.div className="flex h-screen bg-gray-50">
      <button onClick={toggleSidebar} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm" aria-label="Toggle menu">{sidebarOpen ? <FiX className="text-gray-800 text-xl" /> : <FiMenu className="text-gray-800 text-xl" />}</button>
      <AnimatePresence>
        {sidebarOpen && isMobile && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />}
        <motion.div initial={{ x: isMobile ? -300 : 0 }} animate={{ x: sidebarOpen || !isMobile ? 0 : -300 }} exit={{ x: isMobile ? -300 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className={`fixed md:relative z-50 h-full w-64 ${!sidebarOpen && isMobile ? 'hidden' : 'block'}`}>
          <AdminSidebar activeView={activeView} setActiveView={setActiveView} onNavigate={() => isMobile && setSidebarOpen(false)} pendingCount={adminCounts.orders_pending} newMessagesCount={adminCounts.messages_new} />
        </motion.div>
      </AnimatePresence>
      <div className="flex-1 overflow-auto">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xs sm:shadow-sm p-3 sm:p-4 flex items-center justify-between gap-3"><h1 className="text-xl sm:text-2xl font-bold text-gray-800">{pageTitles[activeView] || 'Dashboard'}</h1><button onClick={() => setSearchOpen(true)} className="border rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Search <kbd className="ml-2 text-xs bg-gray-100 px-1 rounded">Ctrl K</kbd></button></motion.header>
        <motion.main className="p-3 sm:p-4 md:p-6 pb-20 md:pb-6"><AnimatePresence mode="wait"><motion.div key={activeView} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>{renderMainContent()}</motion.div></AnimatePresence></motion.main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={setActiveView} />
      {isMobile && <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t shadow-lg grid grid-cols-5">{[{view:'dashboard',label:'Home'},{view:'orders',label:'Orders'},{view:'inbox',label:'Inbox'},{view:'phones',label:'Phones'},{view:'store',label:'Store'}].map(item=><button key={item.view} onClick={()=>setActiveView(item.view)} className={`py-3 text-xs font-medium ${activeView===item.view?'text-blue-600':'text-gray-500'}`}>{item.label}</button>)}</nav>}
    </motion.div>
  );
};

export default AdminDashboard;
