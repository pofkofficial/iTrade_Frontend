import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { FiActivity, FiAlertCircle, FiArrowDownRight, FiArrowUpRight, FiBarChart2, FiCalendar, FiRefreshCw, FiShoppingBag, FiUsers, FiEye, FiDollarSign, FiTarget } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '@utils/api';

ChartJS.register(...registerables);

const money = value => `₵${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const number = value => Number(value || 0).toLocaleString('en-GH');
const percent = value => `${Number(value || 0).toFixed(1)}%`;
const palette = ['#3157D5', '#16A085', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#64748B', '#EF4444'];

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#111827', padding: 12, cornerRadius: 8 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748B', maxTicksLimit: 8, maxRotation: 0 } },
    y: { beginAtZero: true, grid: { color: '#EEF2F7' }, ticks: { color: '#64748B' } },
  },
};

function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="font-semibold text-slate-900">{title}</h3>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div>
      {action}
    </div>
    {children}
  </section>;
}

function MetricCard({ label, value, change, icon: Icon, accent = 'blue', helper }) {
  const accents = {
    blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700', cyan: 'bg-cyan-50 text-cyan-700',
  };
  const hasChange = change !== undefined && change !== null;
  const positive = Number(change) >= 0;
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{value}</p></div>
      <span className={`rounded-xl p-2.5 ${accents[accent] || accents.blue}`}><Icon size={18} /></span>
    </div>
    <div className="mt-3 flex min-h-5 items-center justify-between gap-2">
      {hasChange ? <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>{positive ? <FiArrowUpRight /> : <FiArrowDownRight />}{positive ? '+' : ''}{change}% vs previous period</span> : <span className="text-xs text-slate-400">{helper || 'Selected period'}</span>}
    </div>
  </div>;
}

function Empty({ children = 'No data available for this period yet.' }) {
  return <div className="flex min-h-44 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">{children}</div>;
}

function DoughnutPanel({ title, subtitle, rows, labelKey, valueKey }) {
  const labels = (rows || []).map(row => String(row[labelKey] || 'Unknown').replaceAll('_', ' '));
  const values = (rows || []).map(row => Number(row[valueKey] || 0));
  const hasData = values.some(value => value > 0);
  const options = { responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 16, color: '#475569' } } } };
  return <Panel title={title} subtitle={subtitle}>{hasData ? <div className="h-64"><Doughnut data={{ labels, datasets: [{ data: values, backgroundColor: palette, borderWidth: 0, hoverOffset: 5 }] }} options={options} /></div> : <Empty />}</Panel>;
}

export default function AnalyticsChart() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/analytics/overview/', { params: { range, _ts: Date.now() } });
      setData(response.data || null);
    } catch (err) {
      const message = err.response?.data?.detail || 'Unable to load store analytics.';
      setError(message);
      if (quiet) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load({ quiet: true }); }, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') load({ quiet: true }); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  const kpis = data?.kpis || {};
  const daily = data?.daily || [];
  const dateLabels = useMemo(() => daily.map(row => new Date(`${row.date}T00:00:00`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })), [daily]);
  const trendOptions = useMemo(() => ({ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, tooltip: { ...baseChartOptions.plugins.tooltip, callbacks: { label: context => context.dataset.label === 'Collected revenue' ? money(context.raw) : number(context.raw) } } } }), []);
  const salesChart = useMemo(() => ({ labels: dateLabels, datasets: [{ label: 'Collected revenue', data: daily.map(row => Number(row.revenue || 0)), borderColor: '#3157D5', backgroundColor: 'rgba(49,87,213,.10)', fill: true, tension: .35, pointRadius: 2, pointHoverRadius: 5 }] }), [dateLabels, daily]);
  const visitorsChart = useMemo(() => ({ labels: dateLabels, datasets: [{ label: 'Visitors', data: daily.map(row => row.visitors || 0), borderColor: '#0F9F83', backgroundColor: 'rgba(15,159,131,.10)', fill: true, tension: .35, pointRadius: 2 }] }), [dateLabels, daily]);
  const ordersChart = useMemo(() => ({ labels: dateLabels, datasets: [{ label: 'Orders', data: daily.map(row => row.orders || 0), backgroundColor: '#8B5CF6', borderRadius: 5, maxBarThickness: 22 }] }), [dateLabels, daily]);
  const funnelRows = data?.funnel || [];
  const funnelChart = useMemo(() => ({ labels: funnelRows.map(row => String(row.event).replaceAll('_', ' ')), datasets: [{ label: 'Unique visitors', data: funnelRows.map(row => row.unique_visitors || 0), backgroundColor: ['#3157D5', '#4773E6', '#16A085', '#F59E0B', '#8B5CF6'], borderRadius: 6, maxBarThickness: 34 }] }), [funnelRows]);
  const topProducts = data?.top_products || [];
  const productChart = useMemo(() => ({ labels: topProducts.slice(0, 8).map(row => row.product), datasets: [{ label: 'Collected revenue', data: topProducts.slice(0, 8).map(row => Number(row.revenue || 0)), backgroundColor: '#3157D5', borderRadius: 5 }] }), [topProducts]);
  const regions = data?.regions || [];
  const regionChart = useMemo(() => ({ labels: regions.map(row => row.region || 'Not specified'), datasets: [{ label: 'Orders', data: regions.map(row => row.orders || 0), backgroundColor: '#0F9F83', borderRadius: 5 }] }), [regions]);
  const horizontalOptions = useMemo(() => ({ ...baseChartOptions, indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: '#EEF2F7' }, ticks: { color: '#64748B' } }, y: { grid: { display: false }, ticks: { color: '#475569' } } } }), []);
  const rangeLabel = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '12m': 'Last 12 months' }[range];

  if (loading && !data) return <div className="space-y-5"><div className="h-24 animate-pulse rounded-2xl bg-slate-200"/><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200"/>)}</div><div className="grid gap-4 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-slate-200"/><div className="h-80 animate-pulse rounded-2xl bg-slate-200"/></div></div>;

  return <div className="space-y-5 sm:space-y-6">
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-5 text-white shadow-lg sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-200">Business intelligence</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Store analytics</h2><p className="mt-2 max-w-2xl text-sm text-blue-100">A complete view of sales, visitors, guest customers, product interest and where your orders come from.</p></div>
        <div className="flex items-center gap-2"><select value={range} onChange={event => setRange(event.target.value)} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none [&>option]:text-slate-900"><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option><option value="12m">12 months</option></select><button onClick={() => load({ quiet: true })} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-blue-50 disabled:opacity-60"><FiRefreshCw className={refreshing ? 'animate-spin' : ''}/>Refresh</button></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-blue-100"><span className="inline-flex items-center gap-1.5"><FiCalendar/>{rangeLabel}</span><span>Revenue includes paid orders and COD orders marked cash collected</span>{data?.generated_at && <span>Updated {new Date(data.generated_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</span>}</div>
    </div>

    {error && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><FiAlertCircle/>{error}<button onClick={() => load()} className="ml-auto font-semibold underline">Retry</button></div>}

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard label="Collected revenue" value={money(kpis.collected_revenue)} change={kpis.revenue_change_percent} icon={FiDollarSign} accent="green" />
      <MetricCard label="Orders placed" value={number(kpis.orders)} change={kpis.orders_change_percent} icon={FiShoppingBag} accent="blue" />
      <MetricCard label="Average order value" value={money(kpis.average_order_value)} icon={FiTarget} accent="violet" helper="Collected revenue ÷ collected orders" />
      <MetricCard label="Unique visitors" value={number(kpis.visitors)} change={kpis.visitors_change_percent} icon={FiEye} accent="cyan" />
      <MetricCard label="Page views" value={number(kpis.page_views)} icon={FiActivity} accent="amber" />
      <MetricCard label="Purchase conversion" value={percent(kpis.conversion_rate)} icon={FiBarChart2} accent="green" helper="Tracked purchase visitors ÷ visitors" />
      <MetricCard label="Repeat customers" value={number(kpis.repeat_customers)} icon={FiUsers} accent="violet" helper={`${percent(kpis.repeat_rate)} of active guest customers`} />
      <MetricCard label="Cancellation rate" value={percent(kpis.cancellation_rate)} icon={FiAlertCircle} accent="rose" helper={`${number(kpis.cancelled_orders)} cancelled orders`} />
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Collected revenue trend" subtitle="Daily revenue from successfully paid orders and collected COD orders"><div className="h-72">{daily.length ? <Line data={salesChart} options={trendOptions}/> : <Empty/>}</div></Panel>
      <Panel title="Visitor trend" subtitle="Daily unique anonymous browser visitors (bots excluded)"><div className="h-72">{daily.length ? <Line data={visitorsChart} options={baseChartOptions}/> : <Empty/>}</div></Panel>
      <Panel title="Order volume" subtitle="Orders created during the selected period"><div className="h-64">{daily.length ? <Bar data={ordersChart} options={baseChartOptions}/> : <Empty/>}</div></Panel>
      <Panel title="Sales funnel" subtitle="Unique browser identifiers at each tracked shopping step"><div className="h-64">{funnelRows.some(row => row.unique_visitors > 0) ? <Bar data={funnelChart} options={horizontalOptions}/> : <Empty>Funnel data will appear as storefront product, cart, checkout and purchase events are tracked.</Empty>}</div><p className="mt-2 text-xs text-slate-400">Funnel counts are event-based and may include visitors who did not complete the previous step.</p></Panel>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <DoughnutPanel title="Payment methods" subtitle="How customers chose to pay" rows={data?.payment_split} labelKey="payment_method" valueKey="orders" />
      <DoughnutPanel title="Order status mix" subtitle="Current status of orders created in this period" rows={data?.order_statuses} labelKey="status" valueKey="orders" />
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Top-selling products" subtitle="Ranked by collected sales value; no stock counts used"><div className="h-80">{topProducts.length ? <Bar data={productChart} options={horizontalOptions}/> : <Empty>No collected product sales in this period.</Empty>}</div></Panel>
      <Panel title="Orders by region" subtitle="Delivery destinations for orders created in this period"><div className="h-80">{regions.length ? <Bar data={regionChart} options={horizontalOptions}/> : <Empty/>}</div></Panel>
    </div>

    <Panel title="Top customers" subtitle="Guest customers with the highest collected spend in this period">
      {(data?.top_customers || []).length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-3">Customer</th><th className="pb-3">Phone</th><th className="pb-3 text-right">Orders</th><th className="pb-3 text-right">Collected spend</th></tr></thead><tbody>{data.top_customers.map((customer, index) => <tr key={`${customer.phone}-${index}`} className="border-b border-slate-100 last:border-0"><td className="py-3 font-medium text-slate-800">{customer.name || 'Guest customer'}</td><td className="py-3 text-slate-600">{customer.phone}</td><td className="py-3 text-right">{number(customer.orders)}</td><td className="py-3 text-right font-semibold">{money(customer.revenue)}</td></tr>)}</tbody></table></div> : <Empty>No collected customer spend in this period.</Empty>}
    </Panel>

    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Customer insights" subtitle="Guest customers identified by checkout phone number">
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="All-time customers" value={kpis.all_customers}/><MiniStat label="Active this period" value={kpis.active_customers}/><MiniStat label="First-time customers" value={kpis.new_customers}/><MiniStat label="Repeat customers" value={kpis.repeat_customers}/><MiniStat label="Orders per customer" value={kpis.orders_per_customer}/><MiniStat label="Revenue per visitor" value={money(kpis.revenue_per_visitor)}/>
        </div><div className="mt-4 rounded-xl bg-violet-50 p-3"><p className="text-xs text-violet-700">Repeat customer rate</p><p className="mt-1 text-2xl font-bold text-violet-950">{percent(kpis.repeat_rate)}</p></div>
      </Panel>
      <Panel title="Customer inbox" subtitle="Enquiries received in this period">
        <div className="space-y-3"><MiniStat label="Total enquiries" value={data?.messages?.total}/><MiniStat label="New / unread" value={data?.messages?.new}/><MiniStat label="Replied" value={data?.messages?.replied}/></div>
      </Panel>
      <Panel title="Traffic sources" subtitle="Campaign tags from your storefront">
        {(data?.sources || []).length ? <div className="space-y-3">{data.sources.slice(0, 6).map((source, index) => <div key={`${source.utm_source}-${source.utm_medium}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium capitalize text-slate-800">{source.utm_source}</p><p className="truncate text-xs text-slate-400">{[source.utm_medium, source.utm_campaign].filter(Boolean).join(' · ') || 'No campaign details'}</p></div><span className="text-sm font-semibold text-slate-700">{number(source.visits)}</span></div>)}</div> : <Empty>No tagged campaign traffic yet.</Empty>}
      </Panel>
    </div>

    <Panel title="Product demand signals" subtitle="Customer interest compared with guest orders — deliberately independent of stock quantities">
      {(data?.demand_signals || []).length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-3">Product</th><th className="pb-3 text-right">Views</th><th className="pb-3 text-right">Visitors</th><th className="pb-3 text-right">Cart adds</th><th className="pb-3 text-right">Orders</th><th className="pb-3 text-right">Units</th><th className="pb-3 text-right">Signal</th></tr></thead><tbody>{data.demand_signals.map(item => <tr key={item.phone_id} className="border-b border-slate-100 last:border-0"><td className="py-3 font-medium text-slate-800">{item.product}</td><td className="py-3 text-right">{number(item.views)}</td><td className="py-3 text-right">{number(item.unique_visitors)}</td><td className="py-3 text-right">{number(item.cart_adds)}</td><td className="py-3 text-right">{number(item.orders)}</td><td className="py-3 text-right">{number(item.units)}</td><td className="py-3 text-right"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.signal}</span></td></tr>)}</tbody></table></div> : <Empty>Product demand will populate once product_view and add_to_cart events include a phone ID.</Empty>}
    </Panel>

    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Top referring websites" subtitle="External referrers recorded with page visits">{(data?.referrers || []).length ? <div className="space-y-2">{data.referrers.map((row, index) => <div key={`${row.referrer}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0"><span className="truncate text-sm text-slate-700">{row.referrer}</span><b className="text-sm text-slate-900">{number(row.visits)}</b></div>)}</div> : <Empty>No referrer information recorded yet.</Empty>}</Panel>
      <Panel title="Analytics notes" subtitle="How to interpret the numbers">
        <ul className="space-y-2 text-sm leading-6 text-slate-600"><li>• Revenue counts paid online orders and COD orders marked as cash collected; unpaid orders are excluded.</li><li>• Customers are grouped by the phone number entered at guest checkout, not by user accounts.</li><li>• Unique visitors use the anonymous browser identifier, with hashed IP fallback for older visits without one.</li><li>• Funnel conversion uses tracked purchase events. It becomes meaningful once the storefront sends all funnel events consistently.</li><li>• Product demand uses views, cart additions and non-cancelled guest orders. It does not use inventory stock.</li></ul>
      </Panel>
    </div>
    <p className="text-right text-xs text-slate-400">Analytics refresh automatically every minute while this page is open.</p>
  </div>;
}

function MiniStat({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{number(value)}</p></div>;
}
