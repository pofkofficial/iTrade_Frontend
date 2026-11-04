import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiSmartphone, 
  FiBarChart2, 
  FiShoppingBag, FiCreditCard, FiLayers, FiUsers, FiTruck,
  FiLogOut, 
  FiX, FiSettings, FiShield, FiInbox 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ activeView, setActiveView, onNavigate, pendingCount = 0, newMessagesCount = 0 }) => {
  const { logout } = useAuth();
  const menuItems = [
    { icon: <FiHome size={20} />, label: 'Dashboard', view: 'dashboard' },
    { icon: <FiSmartphone size={20} />, label: 'Phones', view: 'phones' },
    { icon: <FiShoppingBag size={20} />, label: 'Orders', view: 'orders', count: pendingCount },
    { icon: <FiCreditCard size={20} />, label: 'Payments', view: 'payments' },
    { icon: <FiLayers size={20} />, label: 'Bulk Variants', view: 'variants' },
    { icon: <FiUsers size={20} />, label: 'Customers', view: 'customers' },
    { icon: <FiTruck size={20} />, label: 'Delivery Sheet', view: 'deliveries' },
    { icon: <FiBarChart2 size={20} />, label: 'Analytics', view: 'analytics' },
    { icon: <FiInbox size={20} />, label: 'Customer Inbox', view: 'inbox', count: newMessagesCount },
    { icon: <FiShield size={20} />, label: 'Security & Audit', view: 'security' },
    { icon: <FiSettings size={20} />, label: 'Store Controls', view: 'store' },
  ];

  const handleNavigation = (view) => {
    setActiveView(view);
    if (onNavigate) onNavigate();
  };

  return (
    <motion.aside
      className="bg-gradient-to-b from-blue-700 to-blue-800 text-white p-4 h-full w-64 fixed md:relative"
    >
      <div className="h-full flex flex-col">
        <div className="flex justify-end md:hidden mb-4">
          <button 
            onClick={onNavigate}
            className="p-2 text-white hover:text-gray-200 rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Close sidebar"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="px-4 mb-8">
          <h1 className="text-xl md:text-2xl font-bold">iTrade Admin</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 md:space-y-2">
            {menuItems.map((item) => (
              <motion.li 
                key={item.view}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleNavigation(item.view)}
                  className={`flex items-center p-2 md:p-3 rounded-lg transition-colors w-full text-left
                    ${activeView === item.view 
                      ? 'bg-blue-600 shadow-md' 
                      : 'hover:bg-blue-600 hover:shadow-md'}`}
                >
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                  <span className="text-sm md:text-base flex-1">{item.label}</span>
                  {item.count > 0 && <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{item.count > 99 ? '99+' : item.count}</span>}
                </button>
              </motion.li>
            ))}
          </ul>
        </nav>

        <motion.div
          className="mt-auto p-2 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.5 } }}
        >
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-500 
              text-white py-2 px-3 md:py-2 md:px-4 rounded-lg transition
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-700"
          >
            <FiLogOut className="mr-2" size={18} />
            <span className="text-sm md:text-base">Log Out</span>
          </button>
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;