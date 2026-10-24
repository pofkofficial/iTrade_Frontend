'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiDollarSign, 
  FiShoppingBag, 
  FiMail, 
  FiUser,
  FiTrendingUp,
  FiTrendingDown,
  FiGlobe
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { toast } from 'react-toastify';

// === HELPERS ===
const safeArray = (arr) => {
  if (Array.isArray(arr)) return arr;
  if (arr && typeof arr === 'object') {
    // Handle API pagination responses
    if (arr.results) return arr.results;
    if (arr.data) return arr.data;
  }
  return [];
};

const safeNumber = (num, fallback = 0) => {
  if (num === null || num === undefined) return fallback;
  const n = Number(String(num).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? fallback : n;
};

const formatCurrency = (amount) => {
  const num = safeNumber(amount);
  return `₵${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StatsCards = ({ orders = [], messages = [] }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: visitData, loading: visitsLoading } = useFetch('/analytics/visits/', {}, []);

  const [visits, setVisits] = useState(0);
  const [visitChange, setVisitChange] = useState(0);

  // Ensure we always work with arrays
  const ordersArray = safeArray(orders);
  const messagesArray = safeArray(messages);

  // === DEBUG: LOG DATA ===
  useEffect(() => {
    if (ordersArray.length > 0) {
      console.log('FIRST ORDER FOR STATS:', ordersArray[0]);
      console.log('total_price type:', typeof ordersArray[0].total_price, 'value:', ordersArray[0].total_price);
    } else {
      console.log('No orders found in StatsCards. Original orders:', orders);
      console.log('Processed orders array:', ordersArray);
    }
  }, [orders, ordersArray]);

  // === VISITS ===
  useEffect(() => {
    if (!visitData) return;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const todayCount = safeNumber(visitData.daily?.[today]);
    const yesterdayCount = safeNumber(visitData.daily?.[yesterday]);
    setVisits(visitData.count || 0);
    setVisitChange(
      yesterdayCount > 0
        ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
        : todayCount > 0 ? 100 : 0
    );
  }, [visitData]);

  // === STATS CALCULATION ===
  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);
    const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
    const twoMonthsAgo = new Date(now); twoMonthsAgo.setMonth(now.getMonth() - 2);

    const delivered = ordersArray.filter(o => o.status === 'delivered');

    // === TOTAL SALES (FIXED) ===
    const totalSales = delivered.reduce((sum, o) => {
      const price = safeNumber(o.total_price);
      return sum + price;
    }, 0);

    const currentWeekSales = delivered
      .filter(o => new Date(o.created_at) > oneWeekAgo)
      .reduce((sum, o) => sum + safeNumber(o.total_price), 0);

    const previousWeekSales = delivered
      .filter(o => new Date(o.created_at) > twoWeeksAgo && new Date(o.created_at) <= oneWeekAgo)
      .reduce((sum, o) => sum + safeNumber(o.total_price), 0);

    const salesChange = previousWeekSales > 0
      ? Math.round(((currentWeekSales - previousWeekSales) / previousWeekSales) * 100)
      : currentWeekSales > 0 ? 100 : 0;

    // === OTHER STATS (UNCHANGED) ===
    const recentDeliveries = delivered.filter(o => new Date(o.created_at) > oneWeekAgo).length;
    const previousDeliveries = delivered.filter(o => new Date(o.created_at) > twoWeeksAgo && new Date(o.created_at) <= oneWeekAgo).length;
    const deliveryChange = previousDeliveries > 0
      ? Math.round(((recentDeliveries - previousDeliveries) / previousDeliveries) * 100)
      : recentDeliveries > 0 ? 100 : 0;

    const unreadMessages = messagesArray.filter(m => m.status === 'new').length;
    const currentWeekMsgs = messagesArray.filter(m => new Date(m.created_at) > oneWeekAgo).length;
    const previousWeekMsgs = messagesArray.filter(m => new Date(m.created_at) > twoWeeksAgo && new Date(m.created_at) <= oneWeekAgo).length;
    const messageChange = previousWeekMsgs > 0
      ? Math.round(((currentWeekMsgs - previousWeekMsgs) / previousWeekMsgs) * 100)
      : currentWeekMsgs > 0 ? 100 : 0;

    const customerMap = new Map();
    ordersArray.forEach(order => {
      const key = `${order.customer_email?.toLowerCase() || ''}|${order.customer_phone_number || ''}`;
      const date = new Date(order.created_at);
      if (!customerMap.has(key) || customerMap.get(key) > date) {
        customerMap.set(key, date);
      }
    });

    const currentMonth = Array.from(customerMap.values()).filter(d => d > oneMonthAgo).length;
    const previousMonth = Array.from(customerMap.values()).filter(d => d > twoMonthsAgo && d <= oneMonthAgo).length;
    const newCustomers = Math.max(0, currentMonth - previousMonth);
    const customerChange = previousMonth > 0
      ? Math.round(((newCustomers - previousMonth) / previousMonth) * 100)
      : newCustomers > 0 ? 100 : 0;

    return [
      { label: 'Total Sales', value: formatCurrency(totalSales), change: salesChange, icon: <FiDollarSign />, color: 'green' },
      { label: 'Recent Deliveries', value: recentDeliveries, change: deliveryChange, icon: <FiShoppingBag />, color: 'blue' },
      { label: 'Unread Messages', value: unreadMessages, change: messageChange, icon: <FiMail />, color: 'purple' },
      { label: 'New Customers', value: newCustomers, change: customerChange, icon: <FiUser />, color: 'orange' },
      { label: 'Website Visits', value: visits.toLocaleString(), change: visitChange, icon: <FiGlobe />, color: 'indigo' },
    ];
  }, [ordersArray, messagesArray, visits, visitChange]);

  if (authLoading || visitsLoading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array(5).fill().map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="flex justify-between mb-4"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="h-4 bg-gray-200 rounded w-16" /></div>
            <div className="h-8 bg-gray-200 rounded w-32" /><div className="h-4 bg-gray-200 rounded w-20 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => {
        const isUp = stat.change >= 0;
        
        // Fixed color classes - using explicit classes instead of template literals
        const colorClasses = {
          green: { bg: 'bg-green-50', text: 'text-green-600' },
          blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
          purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
          orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
          indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' }
        };
        
        const colorClass = colorClasses[stat.color] || colorClasses.green;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-gray-200"
          >
            <div className="flex justify-between mb-4">
              <div className={`p-3 rounded-full ${colorClass.bg} ${colorClass.text}`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                {isUp ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(stat.change)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            <div className={`h-1.5 mt-3 rounded-full bg-gray-100`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.abs(stat.change))}%` }}
                className={`h-full rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsCards;