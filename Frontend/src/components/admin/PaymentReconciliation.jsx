import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '@utils/api';

const money = value => `₵${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = value => value ? new Date(value).toLocaleString() : '—';

export default function PaymentReconciliation() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState(null);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/payments/reconciliation/', { params: { payment_status: filter, overdue: 'true' } });
      setRows(response.data?.results || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not load payment reconciliation queue.');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const verify = async (order) => {
    setRefreshingId(order.id);
    try {
      await api.post(`/admin/orders/${order.id}/verify-payment/`);
      toast.success(`Payment confirmed for ${order.order_number}.`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment could not be verified.');
    } finally { setRefreshingId(null); }
  };

  return <section className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-gray-900">Payment reconciliation</h2><p className="text-sm text-gray-500">Compare pending order payments with Paystack before marking them paid.</p></div>
      <div className="flex gap-2"><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-md border px-3 py-2 text-sm"><option value="pending">Pending payments</option><option value="paid">Paid payments</option><option value="failed">Failed payments</option></select><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"><FiRefreshCw className={loading ? 'animate-spin' : ''}/>Refresh</button></div>
    </div>
    {filter === 'pending' && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Pending Paystack payments older than one hour appear here. Only exact GHS amount matches can be reconciled.</p>}
    {loading ? <p className="py-10 text-center text-sm text-gray-500">Loading payments…</p> : rows.length === 0 ? <p className="py-10 text-center text-sm text-gray-500">No {filter} payments found.</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Reference</th><th className="p-3">Amount</th><th className="p-3">Age</th><th className="p-3">Payment</th><th className="p-3">Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b last:border-0"><td className="p-3 font-medium">{row.order_number}<div className="text-xs text-gray-500">{date(row.created_at)}</div></td><td className="p-3">{row.customer_name}<div className="text-xs text-gray-500">{row.customer_phone_number}</div></td><td className="p-3 font-mono text-xs">{row.payment_reference || 'Missing reference'}</td><td className="p-3 font-semibold">{money(row.total_price)}</td><td className="p-3">{row.age_hours}h</td><td className="p-3 capitalize">{row.payment_method?.replaceAll('_', ' ')}<div className="text-xs text-gray-500">{row.payment_status}</div></td><td className="p-3">{filter === 'pending' && <button disabled={refreshingId === row.id || !row.payment_reference || row.payment_method !== 'mobile_money'} onClick={() => verify(row)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40">{refreshingId === row.id ? <FiRefreshCw className="animate-spin"/> : <FiCheckCircle/>} Verify</button>}{filter !== 'pending' && <span className="inline-flex items-center gap-1 text-green-700"><FiCheckCircle/>Recorded</span>}</td></tr>)}</tbody></table></div>}
  </section>;
}
