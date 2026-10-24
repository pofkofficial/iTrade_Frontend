import { useState, useMemo, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { FiDownload } from 'react-icons/fi';
import { useFetch } from '../../hooks/useFetch';

const TopSellingPhones = ({ orders: propOrders }) => {
  const [viewMode, setViewMode] = useState('units'); // 'units' or 'revenue'
  const [breakdown, setBreakdown] = useState('model'); // 'brand', 'model', 'variant'
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  const [timeRange, setTimeRange] = useState('6m'); // '30d', '6m', '1y', 'all'
  const [brandFilter, setBrandFilter] = useState('all'); // Filter by brand
  const [filterType, setFilterType] = useState('all'); // 'all' or 'delivered'
  const { data: fetchedOrders, loading, error, refetch } = useFetch('/orders/', {}, []);
  const orders = propOrders || fetchedOrders; // Use propOrders if provided, else fetchedOrders

  // Process phone sales data
  const processPhoneData = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return { brandData: {}, modelData: {}, variantData: {} };

    const filteredOrders = filterType === 'delivered'
      ? orders.filter(order => order.status === 'delivered')
      : orders;

    const brandData = {};
    const modelData = {};
    const variantData = {};
    const now = new Date();
    const timeRanges = {
      '30d': new Date(now.setDate(now.getDate() - 30)),
      '6m': new Date(now.setMonth(now.getMonth() - 6)),
      '1y': new Date(now.setFullYear(now.getFullYear() - 1)),
      'all': new Date(0),
    };
    const cutoffDate = timeRanges[timeRange];

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate < cutoffDate) return;

      order.items.forEach((item) => {
        const brand = item.phone?.brand || 'Unknown';
        const model = item.phone ? `${brand} ${item.phone.model}` : 'Unknown Model';
        const variant = item.memory_variant
          ? `${model} (${item.memory_variant.storage_capacity})`
          : model;
        const quantity = item.quantity || 0;
        const revenue = (item.price_at_purchase || 0) * quantity;

        if (brandFilter !== 'all' && brand !== brandFilter) return;

        // Aggregate by brand
        brandData[brand] = brandData[brand] || { units: 0, revenue: 0 };
        brandData[brand].units += quantity;
        brandData[brand].revenue += revenue;

        // Aggregate by model
        modelData[model] = modelData[model] || {
          units: 0,
          revenue: 0,
          thumbnail: item.phone?.thumbnail,
          variants: new Set(),
        };
        modelData[model].units += quantity;
        modelData[model].revenue += revenue;
        if (item.memory_variant?.storage_capacity) {
          modelData[model].variants.add(item.memory_variant.storage_capacity);
        }

        // Aggregate by variant
        variantData[variant] = variantData[variant] || {
          units: 0,
          revenue: 0,
          model,
          storage: item.memory_variant?.storage_capacity,
        };
        variantData[variant].units += quantity;
        variantData[variant].revenue += revenue;
      });
    });

    return { brandData, modelData, variantData };
  }, [orders, timeRange, brandFilter, filterType]);

  const { brandData, modelData, variantData } = processPhoneData;

  // Prepare chart data for main chart
  const mainChartData = useMemo(() => {
    const sortedItems = (data, limit) =>
      Object.entries(data)
        .sort((a, b) => (viewMode === 'units' ? b[1].units - a[1].units : b[1].revenue - a[1].revenue))
        .slice(0, limit);

    let labels = [];
    let data = [];
    let backgroundColor = [];

    if (breakdown === 'brand') {
      const items = sortedItems(brandData, 5);
      labels = items.map(([brand]) => brand);
      data = items.map(([, stats]) => (viewMode === 'units' ? stats.units : stats.revenue));
      backgroundColor = [
        'rgba(79, 70, 229, 0.7)',
        'rgba(99, 102, 241, 0.7)',
        'rgba(129, 140, 248, 0.7)',
        'rgba(165, 180, 252, 0.7)',
        'rgba(203, 213, 255, 0.7)',
      ];
    } else if (breakdown === 'model') {
      const items = sortedItems(modelData, 8);
      labels = items.map(([model]) => model.split(' ').slice(1).join(' '));
      data = items.map(([, stats]) => (viewMode === 'units' ? stats.units : stats.revenue));
      backgroundColor = items.map((_, i) => `hsl(${i * 360 / items.length}, 70%, 60%)`);
    } else {
      const items = sortedItems(variantData, 10);
      labels = items.map(([variant]) => variant);
      data = items.map(([, stats]) => (viewMode === 'units' ? stats.units : stats.revenue));
      backgroundColor = items.map((_, i) => `hsl(${i * 360 / items.length}, 70%, 60%)`);
    }

    return {
      labels,
      datasets: [
        {
          label: viewMode === 'units' ? 'Units Sold' : 'Revenue (₵)',
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  }, [breakdown, viewMode, brandData, modelData, variantData]);

  // Prepare time trend data
  const timeTrendData = useMemo(() => {
    const monthlyData = {};
    const now = new Date();
    const cutoffDate = {
      '30d': new Date(now.setDate(now.getDate() - 30)),
      '6m': new Date(now.setMonth(now.getMonth() - 6)),
      '1y': new Date(now.setFullYear(now.getFullYear() - 1)),
      'all': new Date(0),
    }[timeRange];

    const filteredOrders = filterType === 'delivered'
      ? orders.filter(order => order.status === 'delivered')
      : orders;

    filteredOrders?.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate < cutoffDate) return;

      const month = orderDate.getMonth();
      const year = orderDate.getFullYear();
      if (year !== new Date().getFullYear()) return;

      order.items.forEach((item) => {
        const brand = item.phone?.brand || 'Unknown';
        if (brandFilter !== 'all' && brand !== brandFilter) return;

        const model = item.phone ? `${brand} ${item.phone.model}` : 'Unknown Model';
        const key = `${month}-${model}`;
        monthlyData[key] = monthlyData[key] || { month, model, units: 0, revenue: 0 };
        monthlyData[key].units += item.quantity || 0;
        monthlyData[key].revenue += (item.price_at_purchase || 0) * (item.quantity || 0);
      });
    });

    const topModels = Object.entries(modelData)
      .sort((a, b) => (viewMode === 'units' ? b[1].units - a[1].units : b[1].revenue - a[1].revenue))
      .slice(0, 3)
      .map(([model]) => model);

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      labels: monthLabels.slice(0, new Date().getMonth() + 1),
      datasets: topModels.map((model, i) => {
        const color = `hsl(${i * 120}, 70%, 50%)`;
        return {
          label: model,
          data: monthLabels.slice(0, new Date().getMonth() + 1).map((_, month) => {
            const key = `${month}-${model}`;
            return monthlyData[key] ? (viewMode === 'units' ? monthlyData[key].units : monthlyData[key].revenue) : 0;
          }),
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          fill: false,
        };
      }),
    };
  }, [orders, viewMode, timeRange, brandFilter, modelData, filterType]);

  // Prepare variant distribution data
  const variantDistributionData = useMemo(() => {
    const storageCounts = {};
    Object.values(variantData).forEach((variant) => {
      if (!variant.storage) return;
      storageCounts[variant.storage] = storageCounts[variant.storage] || 0;
      storageCounts[variant.storage] += viewMode === 'units' ? variant.units : variant.revenue;
    });

    return {
      labels: Object.keys(storageCounts),
      datasets: [
        {
          data: Object.values(storageCounts),
          backgroundColor: [
            'rgba(79, 70, 229, 0.7)',
            'rgba(99, 102, 241, 0.7)',
            'rgba(129, 140, 248, 0.7)',
            'rgba(165, 180, 252, 0.7)',
            'rgba(203, 213, 255, 0.7)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [variantData, viewMode]);

  // Export data as CSV
  const exportToCSV = () => {
    const headers = ['Model', 'Brand', 'Units', 'Revenue', 'Avg. Price', 'Variants'];
    const rows = Object.entries(modelData)
      .sort((a, b) => b[1].units - a[1].units)
      .slice(0, 5)
      .map(([model, data]) => [
        model.split(' ').slice(1).join(' '),
        model.split(' ')[0],
        data.units.toLocaleString(),
        `₵${data.revenue.toLocaleString()}`,
        `₵${(data.units > 0 ? Math.round(data.revenue / data.units) : 0).toLocaleString()}`,
        Array.from(data.variants).join(', '),
      ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `top_selling_phones_${filterType}_${new Date().toISOString()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported as CSV');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Error loading sales data: {error}
        <button
          onClick={refetch}
          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-4 bg-gray-100 text-gray-700 rounded-lg">
        No sales data available. Start selling phones to see analytics!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-xs sm:shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
        <h4 className="text-lg font-semibold">Phone Sales Analytics</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            aria-label="Select time range"
          >
            <option value="30d">Last 30 Days</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <select
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            aria-label="Select brand filter"
          >
            <option value="all">All Brands</option>
            <option value="Samsung">Samsung</option>
            <option value="Google">Google</option>
          </select>
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center"
            aria-label="Export data as CSV"
          >
            <FiDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {['brand', 'model', 'variant'].map((type) => (
          <button
            key={type}
            onClick={() => setBreakdown(type)}
            className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md ${
              breakdown === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            aria-label={`View by ${type}`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setChartType(chartType === 'bar' ? 'pie' : 'bar')}
          className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md bg-gray-100 text-gray-700"
          aria-label={`Switch to ${chartType === 'bar' ? 'pie' : 'bar'} chart`}
        >
          {chartType === 'bar' ? 'Pie' : 'Bar'}
        </button>
      </div>

      {/* Main Chart */}
      <div className="mb-6 sm:mb-8">
        <div className="h-64 sm:h-80">
          {chartType === 'bar' ? (
            <Bar
              data={mainChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `${context.dataset.label}: ${context.raw.toLocaleString()}`,
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      maxRotation: breakdown === 'variant' ? 45 : 0,
                      minRotation: breakdown === 'variant' ? 45 : 0,
                    },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => value.toLocaleString(),
                    },
                  },
                },
              }}
            />
          ) : (
            <Pie
              data={mainChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${context.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          {viewMode === 'units' ? 'Units sold' : 'Revenue generated'} by {breakdown} for {filterType === 'delivered' ? 'delivered' : 'all'} orders.
          {breakdown === 'brand' && ' Shows which brands are most popular.'}
          {breakdown === 'model' && ' Shows specific model performance.'}
          {breakdown === 'variant' && ' Shows which storage variants sell best.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Time Trend Chart */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h5 className="font-medium mb-2 text-sm sm:text-base">Monthly Trend for Top Models</h5>
          <div className="h-56 sm:h-64">
            <Line
              data={timeTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `${context.dataset.label}: ${context.raw.toLocaleString()}`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => value.toLocaleString(),
                    },
                  },
                },
              }}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Shows how your top models perform over time for {filterType === 'delivered' ? 'delivered' : 'all'} orders. Look for seasonal patterns or growth trends.
          </p>
        </div>

        {/* Variant Distribution */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h5 className="font-medium mb-2 text-sm sm:text-base">Storage Variant Distribution</h5>
          <div className="h-56 sm:h-64">
            <Pie
              data={variantDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${context.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Shows which storage capacities are most popular for {filterType === 'delivered' ? 'delivered' : 'all'} orders. Helps with inventory planning.
          </p>
        </div>
      </div>

      {/* Top Models Detailed Table */}
      <div className="mt-6 sm:mt-8">
        <h5 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Top Selling Models</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Units
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg. Price
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Variants
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(modelData)
                .sort((a, b) => b[1].units - a[1].units)
                .slice(0, 5)
                .map(([model, data], index) => (
                  <tr key={index}>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          {data.thumbnail && (
                            <img
                              className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                              src={data.thumbnail}
                              alt={model}
                            />
                          )}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                            {model.split(' ').slice(1).join(' ')}
                          </div>
                          <div className="text-xs text-gray-500">{model.split(' ')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {data.units.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      ₵{data.revenue.toLocaleString()}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      ₵{(data.units > 0 ? Math.round(data.revenue / data.units) : 0).toLocaleString()}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 truncate max-w-[100px]">
                      {Array.from(data.variants).join(', ') || 'No variants'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopSellingPhones;