import { useState } from 'react';
import { FiMail, FiSend } from 'react-icons/fi';
import MessageList from './MessageList';
import InboxReplies from './InboxReplies';

export default function CustomerInbox() {
  const [tab, setTab] = useState('enquiries');
  return <section className="space-y-4">
    <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">Customer communication</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Customer Inbox</h2><p className="mt-1 text-sm text-slate-500">Manage website enquiries, read messages and reply to customers by email.</p></div>
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button onClick={() => setTab('enquiries')} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === 'enquiries' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><FiMail/> Enquiries & messages</button>
      <button onClick={() => setTab('replies')} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === 'replies' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><FiSend/> Email replies</button>
    </div>
    {tab === 'enquiries' ? <MessageList /> : <InboxReplies />}
  </section>;
}
