import { useEffect, useState } from 'react';
import api from '@utils/api';

const signalStyles = {
  high_interest_no_sales: 'bg-amber-100 text-amber-800',
  cart_interest_no_orders: 'bg-red-100 text-red-700',
  converting_interest: 'bg-green-100 text-green-800',
  normal: 'bg-gray-100 text-gray-700',
};
const signalLabels = {
  high_interest_no_sales: 'High views, no orders',
  cart_interest_no_orders: 'Added to cart, no orders',
  converting_interest: 'Interest converting to orders',
  normal: 'Growing interest',
};

export default function DemandSignals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/analytics/demand/', {
        params: { days, _ts: Date.now() },
      });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load product demand data.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [days]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Product demand signals</h2>
          <p className="text-sm text-gray-500">See which products visitors view and add to cart, compared with orders. No stock counts are used.</p>
        </div>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-2" value={days} onChange={event => setDays(Number(event.target.value))}>
            <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option>
          </select>
          <button onClick={load} disabled={loading} className="border rounded-lg px-3 py-2 disabled:opacity-50">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !data ? <p>Loading product demand…</p> : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <h3 className="font-semibold p-4">Products attracting attention</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr>
              <th className="text-left p-3">Product</th>
              <th className="text-right p-3">Views</th>
              <th className="text-right p-3">Unique visitors</th>
              <th className="text-right p-3">Cart adds</th>
              <th className="text-right p-3">Orders</th>
              <th className="text-right p-3">Quantity ordered</th>
              <th className="text-left p-3">Signal</th>
            </tr></thead>
            <tbody>
              {(data?.product_signals || []).map(item => (
                <tr key={item.phone_id} className="border-t">
                  <td className="p-3 font-medium">{item.product}</td>
                  <td className="p-3 text-right">{item.views.toLocaleString()}</td>
                  <td className="p-3 text-right">{item.unique_visitors.toLocaleString()}</td>
                  <td className="p-3 text-right">{item.cart_adds.toLocaleString()}</td>
                  <td className="p-3 text-right">{item.orders.toLocaleString()}</td>
                  <td className="p-3 text-right">{item.ordered_quantity.toLocaleString()}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${signalStyles[item.signal] || signalStyles.normal}`}>{signalLabels[item.signal] || item.signal}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.product_signals?.length && <p className="p-4 text-sm text-gray-500">No product-level demand data yet. The storefront needs to send product_view and add_to_cart events with the product ID.</p>}
        </div>
      )}
    </section>
  );
}
