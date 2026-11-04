import { useState } from 'react';
import { FiDownload, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '@utils/api';
export default function DeliverySheet() {
  const [status, setStatus] = useState(''); const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/admin/delivery-sheet/', { params: status ? { status } : {}, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.setAttribute('download', 'itrade-delivery-sheet.csv'); document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
      toast.success('Delivery sheet downloaded.');
    } catch (err) { toast.error('Could not generate the delivery sheet.'); }
    finally { setDownloading(false); }
  };
  return <section className="max-w-2xl rounded-xl bg-white p-5 sm:p-7 shadow-sm"><div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-3 text-blue-700"><FiTruck size={24}/></div><div><h2 className="text-xl font-bold text-gray-900">Delivery sheet export</h2><p className="text-sm text-gray-500">Download orders grouped by region and town for dispatch.</p></div></div><label className="mb-2 block text-sm font-medium text-gray-700">Optional order status filter</label><select value={status} onChange={e => setStatus(e.target.value)} className="mb-5 w-full rounded-md border px-3 py-2 text-sm"><option value="">All active orders</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="out_for_delivery">Out for delivery</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select><button onClick={download} disabled={downloading} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><FiDownload/>{downloading ? 'Preparing CSV…' : 'Download delivery CSV'}</button><p className="mt-4 text-xs text-gray-500">The CSV includes customer contact details, delivery address, order items, quantity, total, payment status and COD collection status. Cancelled orders are excluded.</p></section>;
}
