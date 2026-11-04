import { useEffect, useState } from 'react';
import api from '@utils/api';

export default function FunnelAnalytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { const res = await api.get('/admin/analytics/funnel/', { params: { days, _ts: Date.now() } }); setData(res.data); }
    catch (e) { setError(e.response?.data?.detail || 'Could not load funnel analytics.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [days]);
  const steps = data?.funnel || [];
  const max = Math.max(1, ...steps.map(x => x.unique_visitors || x.unique_sessions || x.events));
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-900">Sales funnel & traffic sources</h2><p className="text-sm text-gray-500">Understand how anonymous visitors move from browsing to purchase.</p></div><div className="flex gap-2"><select className="border rounded-lg px-3 py-2" value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select><button onClick={load} className="border rounded-lg px-3 py-2">Refresh</button></div></div>
    {error && <p className="text-red-600 text-sm">{error}</p>}{loading && !data ? <p>Loading analytics…</p> : <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">{steps.map(step => <div key={step.event} className="bg-white border rounded-xl p-4"><p className="text-sm capitalize text-gray-500">{step.event.replaceAll('_',' ')}</p><p className="text-2xl font-bold">{(step.unique_visitors || step.unique_sessions || step.events).toLocaleString()}</p><div className="h-2 bg-gray-100 rounded mt-3"><div className="h-2 bg-blue-600 rounded" style={{ width: `${Math.min(100, ((step.unique_visitors || step.unique_sessions || step.events) / max) * 100)}%` }} /></div><p className="text-xs text-gray-400 mt-2">{step.events.toLocaleString()} events</p></div>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="bg-white border rounded-xl p-4"><h3 className="font-semibold mb-3">Campaign sources</h3>{data?.sources?.length ? <div className="divide-y">{data.sources.map((s,i)=><div key={i} className="py-2 flex justify-between gap-3 text-sm"><span>{s.utm_source}{s.utm_medium ? ` / ${s.utm_medium}` : ''}{s.utm_campaign ? ` · ${s.utm_campaign}` : ''}</span><b>{s.visits}</b></div>)}</div> : <p className="text-sm text-gray-500">No UTM-tagged visitors yet.</p>}</div><div className="bg-white border rounded-xl p-4"><h3 className="font-semibold mb-3">Referrers</h3>{data?.referrers?.length ? <div className="divide-y">{data.referrers.map((r,i)=><div key={i} className="py-2 flex justify-between gap-3 text-sm"><span className="truncate">{r.referrer}</span><b>{r.visits}</b></div>)}</div> : <p className="text-sm text-gray-500">No referrer data yet.</p>}</div></div>
    </>}</section>;
}
