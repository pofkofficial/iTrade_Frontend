import { useState, useEffect, useMemo, useCallback } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import TopSellingPhones from './TopPhonesAnalytics';
import { motion } from 'framer-motion';

ChartJS.register(...registerables);

const chartColors = {
  primary: 'rgba(79, 70, 229, 0.7)',
  secondary: 'rgba(99, 102, 241, 0.7)',
  tertiary: 'rgba(129, 140, 248, 0.7)',
  quaternary: 'rgba(165, 180, 252, 0.7)',
  cancelled: 'rgba(239, 68, 68, 0.7)',
  delivered: 'rgba(16, 185, 129, 0.7)',
  shipped: 'rgba(59, 130, 246, 0.7)',
  pending: 'rgba(245, 158, 11, 0.7)',
};

const chartOptions = {
  line: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `₵${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 12 } } },
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 12 } }
      }
    }
  },
  bar: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 12 } } },
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 12 } }
      }
    }
  },
  pie: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: { font: { size: 12 }, padding: 10 }
      }
    }
  }
};

const CardWithTooltip = ({ title, value, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-sm p-3 sm:p-4 relative"
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <h4 className="text-xs sm:text-sm font-medium text-gray-500">{title}</h4>
      <p className="text-lg sm:text-xl md:text-2xl font-bold mt-1">{value}</p>
      {tooltip && (
        <div className="relative">
          <FiInfo className="text-gray-400 absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5" />
          <div className={`${showTooltip ? 'block' : 'hidden'} sm:group-hover:block absolute z-10 w-48 sm:w-64 p-2 bg-white shadow-lg rounded-md text-xs sm:text-sm text-gray-600 -top-2 sm:top-6 right-0 sm:-right-2 mt-2 sm:mt-0`}>
            {tooltip}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div className="bg-gray-100 rounded-lg p-3 sm:p-4 animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
    <div className="h-6 sm:h-8 bg-gray-300 rounded w-1/2"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-gray-100 rounded-lg p-3 sm:p-6 animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
    <div className="h-40 sm:h-64 md:h-80"></div>
  </div>
);

const AnalyticsDashboard = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const { data: orders, loading, error, refetch } = useFetch('/orders/', {}, [user]);
  const [timeRange, setTimeRange] = useState('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login');
    }
    if (authError) {
      toast.error(authError);
    }
    if (error) {
      toast.error(error);
    }
  }, [user, authLoading, authError, error, navigate]);

  const processData = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      console.warn('Orders data is invalid or empty:', orders);
      return {
        monthlyLabels: [],
        weeklyLabels: [],
        monthlySales: [],
        monthlyOrders: [],
        weeklySales: [],
        weeklyOrders: [],
        paymentMethods: { labels: [], data: [] },
        statusDistribution: { labels: [], data: [] },
        uniqueCustomers: 0,
        filteredOrders: [],
        totalSales: 0
      };
    }

    const filteredOrders = filterType === 'delivered'
      ? orders.filter(order => order.status === 'delivered')
      : orders;

    // Calculate total sales with strict type checking
    const totalSales = filteredOrders.reduce((sum, order) => {
      const price = Number(order.total_price) || 0;
      if (isNaN(price)) {
        console.warn(`Invalid total_price for order ${order.id}: ${order.total_price}`);
      }
      return sum + price;
    }, 0);

    const now = new Date();
    const monthlyData = Array(12).fill(0).map((_, i) => {
      const monthOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === i;
      });
      return {
        sales: monthOrders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0),
        count: monthOrders.length
      };
    });

    const weeklyData = Array(4).fill(0).map((_, i) => {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * (i + 1));
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * i);
      const weekOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= weekStart && orderDate < weekEnd;
      });
      return {
        sales: weekOrders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0),
        count: weekOrders.length
      };
    }).reverse();

    const paymentMethods = filteredOrders.reduce((acc, order) => {
      const method = order.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = filteredOrders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const uniqueCustomers = new Set(filteredOrders.map(order => order.customer_email)).size;

    return {
      monthlyLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      weeklyLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      monthlySales: monthlyData.map(m => m.sales),
      monthlyOrders: monthlyData.map(m => m.count),
      weeklySales: weeklyData.map(w => w.sales),
      weeklyOrders: weeklyData.map(w => w.count),
      paymentMethods: {
        labels: Object.keys(paymentMethods).map(label => label.replace(/_/g, ' ')),
        data: Object.values(paymentMethods)
      },
      statusDistribution: {
        labels: Object.keys(statusDistribution).map(label => label.charAt(0).toUpperCase() + label.slice(1)),
        data: Object.values(statusDistribution)
      },
      uniqueCustomers,
      filteredOrders,
      totalSales
    };
  }, [orders, filterType]);

  const {
    monthlyLabels,
    weeklyLabels,
    monthlySales,
    monthlyOrders,
    weeklySales,
    weeklyOrders,
    paymentMethods,
    statusDistribution,
    uniqueCustomers,
    filteredOrders,
    totalSales
  } = processData;

  const salesData = {
    labels: timeRange === 'monthly' ? monthlyLabels.slice(0, new Date().getMonth() + 1) : weeklyLabels,
    datasets: [{
      label: 'Sales (₵)',
      data: timeRange === 'monthly' ? monthlySales : weeklySales,
      borderColor: chartColors.primary,
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.3,
      fill: true
    }]
  };

  const ordersData = {
    labels: timeRange === 'monthly' ? monthlyLabels.slice(0, new Date().getMonth() + 1) : weeklyLabels,
    datasets: [{
      label: 'Orders',
      data: timeRange === 'monthly' ? monthlyOrders : weeklyOrders,
      backgroundColor: chartColors.secondary
    }]
  };

  const paymentMethodData = {
    labels: paymentMethods.labels,
    datasets: [{
      data: paymentMethods.data,
      backgroundColor: [chartColors.primary, chartColors.secondary, chartColors.tertiary, chartColors.quaternary],
      borderWidth: 1
    }]
  };

  const orderStatusData = {
    labels: statusDistribution.labels,
    datasets: [{
      data: statusDistribution.data,
      backgroundColor: [
        chartColors.cancelled,
        chartColors.delivered,
        chartColors.shipped,
        chartColors.pending
      ],
      borderWidth: 1
    }]
  };

  const customerData = {
    labels: ['Unique Customers', 'Total Orders'],
    datasets: [{
      data: [uniqueCustomers, filteredOrders.length],
      backgroundColor: [chartColors.primary, chartColors.secondary],
      borderWidth: 1
    }]
  };

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleFilterTypeChange = useCallback((e) => {
    setFilterType(e.target.value);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonChart />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        <CardWithTooltip 
          title="Total Sales" 
          value={`₵${totalSales.toLocaleString()}`}
          tooltip={`Sum of ${filterType === 'delivered' ? 'delivered' : 'all'} orders in your store's currency`}
        />
        <CardWithTooltip 
          title="Total Orders" 
          value={filteredOrders.length}
          tooltip={`Total number of ${filterType === 'delivered' ? 'delivered' : 'all'} orders placed in your store`}
        />
        <CardWithTooltip 
          title="Avg. Order Value" 
          value={`₵${((totalSales / (filteredOrders.length || 1)).toFixed(2))}`}
          tooltip={`Average amount spent per ${filterType === 'delivered' ? 'delivered' : 'all'} order (Total Sales ÷ Total Orders)`}
        />
        <CardWithTooltip 
          title="Completion Rate" 
          value={`${((filteredOrders.filter(o => o.status === 'delivered').length / (filteredOrders.length || 1) * 100).toFixed(1))}%`}
          tooltip={`Percentage of ${filterType === 'delivered' ? 'delivered' : 'all'} orders that reached 'delivered' status`}
        />
      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h3 className="text-md sm:text-lg md:text-xl font-semibold">Sales & Orders Analytics</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3 self-end sm:self-auto">
            <button
              onClick={() => handleTimeRangeChange('weekly')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${timeRange === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} min-w-[80px]`}
              aria-label="Show weekly data"
            >
              Weekly
            </button>
            <button
              onClick={() => handleTimeRangeChange('monthly')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${timeRange === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} min-w-[80px]`}
              aria-label="Show monthly data"
            >
              Monthly
            </button>
            <select
              value={filterType}
              onChange={handleFilterTypeChange}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              aria-label="Filter orders by status"
            >
              <option value="all">All Orders</option>
              <option value="delivered">Delivered Orders</option>
            </select>
            <button
              onClick={refetch}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 min-w-[80px]"
              aria-label="Refresh data"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} min-w-[80px]`}
            aria-label="Show overview analytics"
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('payments')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${activeTab === 'payments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} min-w-[80px]`}
            aria-label="Show payment methods analytics"
          >
            Payments
          </button>
          <button
            onClick={() => handleTabChange('status')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${activeTab === 'status' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} min-w-[80px]`}
            aria-label="Show order status analytics"
          >
            Status
          </button>
          <button
            onClick={() => handleTabChange('customers')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} min-w-[80px]`}
            aria-label="Show customer analytics"
          >
            Customers
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="min-h-[16rem] sm:min-h-[20rem] md:min-h-[24rem]"
        >
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
              <p>{error}</p>
              <button
                onClick={refetch}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 min-w-[80px]"
              >
                Retry
              </button>
            </div>
          ) : activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="text-sm sm:text-base md:text-lg font-medium mb-2 sm:mb-3 flex items-center">
                  Sales Trend
                  <span className="ml-2 text-xs sm:text-sm text-gray-500">
                    ({timeRange === 'monthly' ? 'Monthly' : 'Weekly'})
                  </span>
                </h4>
                <div className="h-40 sm:h-64 md:h-80">
                  <Line data={salesData} options={chartOptions.line} />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                  Sales performance over time for {filterType === 'delivered' ? 'delivered' : 'all'} orders.
                </p>
              </div>
              <div>
                <h4 className="text-sm sm:text-base md:text-lg font-medium mb-2 sm:mb-3 flex items-center">
                  Order Volume
                  <span className="ml-2 text-xs sm:text-sm text-gray-500">
                    ({timeRange === 'monthly' ? 'Monthly' : 'Weekly'})
                  </span>
                </h4>
                <div className="h-40 sm:h-64 md:h-80">
                  <Bar data={ordersData} options={chartOptions.bar} />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                  Number of {filterType === 'delivered' ? 'delivered' : 'all'} orders received.
                </p>
              </div>
            </div>
          ) : activeTab === 'payments' ? (
            <div>
              <h4 className="text-sm sm:text-base md:text-lg font-medium mb-2 sm:mb-3">Payment Methods</h4>
              <div className="h-40 sm:h-64 md:h-80">
                <Pie data={paymentMethodData} options={chartOptions.pie} />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                Payment methods preferred for {filterType === 'delivered' ? 'delivered' : 'all'} orders.
              </p>
            </div>
          ) : activeTab === 'status' ? (
            <div>
              <h4 className="text-sm sm:text-base md:text-lg font-medium mb-2 sm:mb-3">Order Status</h4>
              <div className="h-40 sm:h-64 md:h-80">
                <Pie data={orderStatusData} options={chartOptions.pie} />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                Current status of {filterType === 'delivered' ? 'delivered' : 'all'} orders.
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm sm:text-base md:text-lg font-medium mb-2 sm:mb-3">Customer Acquisition</h4>
              <div className="h-40 sm:h-64 md:h-80">
                <Pie data={customerData} options={chartOptions.pie} />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                Unique customers vs. total {filterType === 'delivered' ? 'delivered' : 'all'} orders.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6">
          <TopSellingPhones orders={filteredOrders} /> 
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;