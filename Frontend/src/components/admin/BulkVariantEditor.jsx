import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiSave, FiTag, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '@utils/api';

const unwrap = data => Array.isArray(data) ? data : (data?.results || data?.data || []);
export default function BulkVariantEditor() {
  const [variants, setVariants] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState('10');
  const [search, setSearch] = useState('');
  const [phones, setPhones] = useState([]);
  const [sourcePhone, setSourcePhone] = useState('');
  const [cloneName, setCloneName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const [response, phoneResponse] = await Promise.all([api.get('/phone/storage/', { params: { page_size: 100 } }), api.get('/phones/', { params: { page_size: 100 } })]); setVariants(unwrap(response.data)); setPhones(unwrap(phoneResponse.data)); setSelected([]); }
    catch (err) { toast.error('Could not load storage variants.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => variants.filter(v => `${v.phone || ''} ${v.ram || ''} ${v.storage_capacity || ''}`.toLowerCase().includes(search.toLowerCase())), [variants, search]);
  const patchLocal = (id, field, value) => setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  const toggle = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const clonePhone = async () => {
    if (!sourcePhone) return toast.info('Choose a phone to clone.');
    setSaving(true);
    try { const res = await api.post(`/admin/phones/${sourcePhone}/clone/`, cloneName.trim() ? { model: cloneName.trim() } : {}); toast.success(`${res.data?.brand || 'Phone'} ${res.data?.model || ''} cloned as an inactive draft.`); setCloneName(''); setSourcePhone(''); await load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Phone could not be cloned.'); }
    finally { setSaving(false); }
  };

  const save = async () => {
    const updates = variants.filter(v => selected.includes(v.id)).map(v => ({ id: v.id, price: v.price, old_price: v.old_price || null, availability: v.availability }));
    if (!updates.length) return toast.info('Select at least one variant.');
    setSaving(true);
    try { await api.post('/admin/variants/bulk/', { updates }); toast.success(`${updates.length} variant(s) updated.`); await load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Could not save variant changes.'); }
    finally { setSaving(false); }
  };

  const bulkAction = async (action, extra = {}) => {
    if (!selected.length) return toast.info('Select at least one variant.');
    setSaving(true);
    try { await api.post('/admin/variants/bulk/', { action, variant_ids: selected, ...extra }); toast.success('Bulk action applied.'); await load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Bulk action failed.'); }
    finally { setSaving(false); }
  };

  return <section className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-900">Bulk variant editor</h2><p className="text-sm text-gray-500">Edit prices, compare-at prices and availability across phone variants.</p></div><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><FiRefreshCw className={loading ? 'animate-spin' : ''}/>Refresh</button></div>
    <div className="mb-5 rounded-lg border border-dashed p-3"><h3 className="mb-2 text-sm font-semibold text-gray-800">Clone phone with all variants</h3><div className="flex flex-wrap gap-2"><select value={sourcePhone} onChange={e => setSourcePhone(e.target.value)} className="min-w-[200px] flex-1 rounded-md border px-3 py-2 text-sm"><option value="">Choose source phone</option>{phones.map(phone => <option key={phone.id} value={phone.id}>{phone.brand} {phone.model}</option>)}</select><input value={cloneName} onChange={e => setCloneName(e.target.value)} maxLength={20} placeholder="New model name (optional)" className="min-w-[180px] flex-1 rounded-md border px-3 py-2 text-sm"/><button onClick={clonePhone} disabled={saving || !sourcePhone} className="rounded-md bg-slate-700 px-3 py-2 text-sm text-white disabled:opacity-50">Clone phone</button></div><p className="mt-2 text-xs text-gray-500">The clone copies product details, images, RAM/storage variants and prices. Variants are unavailable and the phone is inactive so you can review it before publishing.</p></div>
    <div className="mb-4 flex flex-wrap items-center gap-2"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search phone, RAM or storage…" className="min-w-[220px] flex-1 rounded-md border px-3 py-2 text-sm"/><span className="text-sm text-gray-500">{selected.length} selected</span><input type="number" min="1" max="99" value={discount} onChange={e => setDiscount(e.target.value)} className="w-20 rounded-md border px-2 py-2 text-sm" aria-label="Discount percent"/><button onClick={() => bulkAction('apply_discount', { discount_percent: discount })} disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"><FiTag/>Apply % off</button><button onClick={() => bulkAction('end_sale')} disabled={saving} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50"><FiXCircle/>End sale</button><button onClick={save} disabled={saving || !selected.length} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"><FiSave/>Save selected</button></div>
    {loading ? <p className="py-10 text-center text-sm text-gray-500">Loading variants…</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="p-2"><input type="checkbox" checked={visible.length > 0 && visible.every(v => selected.includes(v.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...visible.map(v => v.id)])] : selected.filter(id => !visible.some(v => v.id === id)))}/></th><th className="p-2">Phone / variant</th><th className="p-2">Price (GHS)</th><th className="p-2">Old price</th><th className="p-2">Available</th></tr></thead><tbody>{visible.map(v => <tr key={v.id} className="border-b"><td className="p-2"><input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)}/></td><td className="p-2 font-medium">{v.phone || 'Phone'}<div className="text-xs text-gray-500">{v.ram} / {v.storage_capacity}</div></td><td className="p-2"><input type="number" min="0.01" step="0.01" value={v.price ?? ''} onChange={e => patchLocal(v.id, 'price', e.target.value)} className="w-28 rounded border px-2 py-1"/></td><td className="p-2"><input type="number" min="0" step="0.01" value={v.old_price ?? ''} onChange={e => patchLocal(v.id, 'old_price', e.target.value)} className="w-28 rounded border px-2 py-1" placeholder="—"/></td><td className="p-2"><input type="checkbox" checked={!!v.availability} onChange={e => patchLocal(v.id, 'availability', e.target.checked)}/></td></tr>)}</tbody></table>{visible.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No matching variants.</p>}</div>}
  </section>;
}
