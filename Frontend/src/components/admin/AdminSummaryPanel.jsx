import { useFetch } from '../../hooks/useFetch';
import { useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const money = (value) => `₵${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminSummaryPanel() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useFetch('/admin/summary/', { params: { range: '7d', _ts: Date.now() } }, [refreshKey]);
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === 'visible') setRefreshKey(v => v + 1); }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) return <div className="mb-5 rounded-xl bg-white p-5 shadow-sm text-sm text-gray-500">Loading store summary…</div>;
  if (error && !data) return <div className="mb-5 rounded-xl bg-white p-5 shadow-sm text-sm text-gray-500">Store summary is temporarily unavailable.</div>;

  return (
    <section className="mb-5 rounded-xl bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Store performance</h3>
          <p className="text-xs text-gray-500">Last 7 days · server-calculated totals</p>
        </div>
        <button type="button" onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"><FiRefreshCw className={loading ? 'animate-spin' : ''} />Refresh summary</button>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <Metric label="Orders" value={data?.orders ?? 0} change={data?.orders_change_percent} />
        <Metric label="Revenue" value={money(data?.revenue)} change={data?.revenue_change_percent} />
        <Metric label="Average order" value={money(data?.average_order_value)} />
        <Metric label="New visitors" value={data?.visitors ?? 0} change={data?.visitors_change_percent} />
        <Metric label="Pending orders" value={data?.pending_orders ?? 0} />
      </div>
      {!!data?.top_phones?.length && (
        <div className="mt-4 border-t pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Top phones by units ordered</h4>
          <div className="flex flex-wrap gap-2">
            {data.top_phones.map((phone, index) => (
              <span key={`${phone['items__phone__brand']}-${phone['items__phone__model']}`} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                {index + 1}. {phone['items__phone__brand']} {phone['items__phone__model']} · {phone.quantity}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, change }) {
  const hasChange = change !== undefined && change !== null;
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg sm:text-xl font-bold text-gray-900">{value}</p>
      {hasChange && <p className={`mt-1 text-xs ${Number(change) >= 0 ? 'text-green-700' : 'text-red-700'}`}>{Number(change) > 0 ? '+' : ''}{change}% vs previous 7 days</p>}
    </div>
  );
}
