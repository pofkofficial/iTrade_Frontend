import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiMail, 
  FiUser, 
  FiClock, 
  FiMessageSquare, 
  FiTrash2,
  FiArchive,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCheckCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { toast } from 'react-toastify';
import MessageDetailsModal from './MessageDetailsModal';
import debounce from 'lodash/debounce';
import api from '@utils/api';

const statusBadgeClass = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-gray-100 text-gray-800',
  replied: 'bg-green-100 text-green-800',
  archived: 'bg-purple-100 text-purple-800'
};

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' }
];

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Date formatting error:', e);
    return 'N/A';
  }
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-gray-200 rounded w-4"></div></td>
    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
    <td className="px-3 sm:px-6 py-4 hidden xs:table-cell"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div></td>
  </tr>
);

const MessageList = ({ initialMessages = null, disableFetch = false }) => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [localMessages, setLocalMessages] = useState(initialMessages || []);

  const params = useMemo(() => ({
    page: currentPage,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    ordering: `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`
  }), [currentPage, searchTerm, statusFilter, sortConfig]);

  const { data, loading, error, refetch } = useFetch(
    disableFetch ? null : '/contact-messages/',
    { params },
    [currentPage, searchTerm, statusFilter, sortConfig, disableFetch]
  );

  const messages = useMemo(() => {
    let messageList = disableFetch ? localMessages : (data?.results || data || []);
    if (searchTerm) {
      messageList = messageList.filter(message =>
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.phone && message.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== 'all') {
      messageList = messageList.filter(message => message.status === statusFilter);
    }
    messageList.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    const startIndex = (currentPage - 1) * 10;
    return messageList.slice(startIndex, startIndex + 10);
  }, [data, localMessages, disableFetch, searchTerm, statusFilter, sortConfig, currentPage]);

  const totalPages = useMemo(() => {
    let messageList = disableFetch ? localMessages : (data?.results || data || []);
    if (searchTerm) {
      messageList = messageList.filter(message =>
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.phone && message.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== 'all') {
      messageList = messageList.filter(message => message.status === statusFilter);
    }
    return Math.ceil(messageList.length / 10) || 1;
  }, [data, localMessages, disableFetch, searchTerm, statusFilter]);

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

  useEffect(() => {
    if (disableFetch && initialMessages) {
      setLocalMessages(initialMessages);
    }
  }, [disableFetch, initialMessages]);

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  }, []);

  const renderSortIcon = useCallback((key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }, [sortConfig]);

  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      if (!disableFetch) {
        await api.patch(`/contact-messages/${id}/`, { status: newStatus });
        refetch();
      } else {
        setLocalMessages(prev => prev.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg));
        setSelectedMessage(prev => (prev?.id === id ? { ...prev, status: newStatus } : prev));
      }
      toast.success(`Message ${id} status updated to ${newStatus}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update message status';
      toast.error(errorMessage);
    }
  }, [disableFetch, refetch]);

  const deleteMessage = useCallback(async (id) => {
    toast(
      <div>
        <p>Delete this message?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                if (!disableFetch) {
                  await api.delete(`/contact-messages/${id}/`);
                  refetch();
                } else {
                  setLocalMessages(prev => prev.filter(msg => msg.id !== id));
                }
                if (selectedMessage?.id === id) {
                  setSelectedMessage(null);
                }
                toast.dismiss();
                toast.success('Message deleted successfully');
              } catch (err) {
                toast.dismiss();
                const errorMessage = err.response?.data?.error || `Failed to delete message ${id}`;
                toast.error(errorMessage);
                console.error(`Delete message ${id} failed:`, err.response?.status, err.response?.data);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  }, [disableFetch, refetch, selectedMessage]);

  const bulkUpdateStatus = useCallback(async (newStatus) => {
    try {
      if (!disableFetch) {
        for (const id of selectedMessages) {
          await api.patch(`/contact-messages/${id}/`, { status: newStatus });
        }
        refetch();
      } else {
        setLocalMessages(prev => 
          prev.map(msg => selectedMessages.includes(msg.id) ? { ...msg, status: newStatus } : msg)
        );
      }
      setSelectedMessages([]);
      toast.success(`Updated ${selectedMessages.length} messages to ${newStatus}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update selected messages';
      toast.error(errorMessage);
    }
  }, [disableFetch, refetch, selectedMessages]);

  const bulkDelete = useCallback(() => {
    toast(
      <div>
        <p>Delete {selectedMessages.length} messages?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                const failedDeletions = [];
                if (!disableFetch) {
                  for (const id of selectedMessages) {
                    try {
                      await api.delete(`/contact-messages/${id}/`);
                    } catch (err) {
                      failedDeletions.push({ id, error: err.response?.data?.error || `Failed to delete message ${id}` });
                      console.error(`Delete message ${id} failed:`, err.response?.status, err.response?.data);
                    }
                  }
                  refetch();
                } else {
                  setLocalMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)));
                }
                if (selectedMessage && selectedMessages.includes(selectedMessage.id)) {
                  setSelectedMessage(null);
                }
                setSelectedMessages([]);
                toast.dismiss();
                if (failedDeletions.length > 0) {
                  toast.error(
                    `Failed to delete ${failedDeletions.length} message(s): ` +
                    failedDeletions.map(f => `ID ${f.id}: ${f.error}`).join('; ')
                  );
                } else {
                  toast.success(`Deleted ${selectedMessages.length} messages successfully`);
                }
              } catch (err) {
                toast.dismiss();
                toast.error(err.response?.data?.error || 'Unexpected error during bulk delete');
                console.error('Bulk delete failed:', err.response?.status, err.response?.data);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  }, [disableFetch, refetch, selectedMessages, selectedMessage]);

  const handleMessageClick = useCallback((message) => {
    setSelectedMessage(message);
    if (message.status === 'new') {
      updateStatus(message.id, 'read');
    }
  }, [updateStatus]);

  const toggleSelectMessage = useCallback((id) => {
    setSelectedMessages(prev => 
      prev.includes(id) ? prev.filter(msgId => msgId !== id) : [...prev, id]
    );
  }, []);

  if (authLoading || (loading && currentPage === 1)) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="flex gap-3 mb-6">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-4"></div></th>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></th>
                <th className="px-3 sm:px-6 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-1/3"></div></th>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></th>
                <th className="px-3 sm:px-6 py-3 hidden xs:table-cell"><div className="h-4 bg-gray-200 rounded w-1/4"></div></th>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></th>
              </tr>
            </thead>
            <tbody>
              {Array(5).fill().map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <div className="mb-4 sm:mb-6 flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Contact Messages</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search messages..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 w-full text-sm sm:text-base"
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 appearance-none w-full text-sm sm:text-base"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-l-4 border-red-400 p-4 mb-4"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                {!disableFetch && (
                  <button 
                    onClick={() => refetch()}
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-2 sm:p-3 bg-blue-50 rounded-lg flex flex-wrap items-center gap-2 sm:gap-4"
          >
            <span className="text-xs sm:text-sm font-medium text-blue-800">
              {selectedMessages.length} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => bulkUpdateStatus('read')}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-100 rounded"
              >
                Mark as read
              </button>
              <button
                onClick={() => bulkUpdateStatus('replied')}
                className="text-xs sm:text-sm text-green-600 hover:text-green-800 px-2 py-1 bg-green-100 rounded"
              >
                Mark as replied
              </button>
              <button
                onClick={() => bulkUpdateStatus('archived')}
                className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 px-2 py-1 bg-purple-100 rounded"
              >
                Archive
              </button>
              <button
                onClick={bulkDelete}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 px-2 py-1 bg-red-100 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedMessages([])}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 px-2 py-1 bg-gray-100 rounded"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 ? (
        <div className="text-center py-8">
          <FiMail className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900">No messages found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'No messages have been received yet'}
          </p>
          {!disableFetch && (
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Refresh
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedMessages.length === messages.length && messages.length > 0}
                        onChange={() => {
                          if (selectedMessages.length === messages.length) {
                            setSelectedMessages([]);
                          } else {
                            setSelectedMessages(messages.map(msg => msg.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        From {renderSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                      onClick={() => handleSort('subject')}
                    >
                      <div className="flex items-center">
                        Subject {renderSortIcon('subject')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Date {renderSortIcon('created_at')}
                      </div>
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xs:table-cell">
                      Status
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => (
                    <motion.tr
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`hover:bg-gray-50 ${message.status === 'new' ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedMessages.includes(message.id)}
                          onChange={() => toggleSelectMessage(message.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => handleMessageClick(message)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{message.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">
                              {message.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 whitespace-nowrap cursor-pointer hidden sm:table-cell"
                        onClick={() => handleMessageClick(message)}
                      >
                        <div className="text-sm text-gray-900 font-medium">{message.subject}</div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate max-w-xs">
                          {message.message.substring(0, 60)}...
                        </div>
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleMessageClick(message)}
                      >
                        {formatDate(message.created_at)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden xs:table-cell">
                        <select
                          value={message.status}
                          onChange={(e) => updateStatus(message.id, e.target.value)}
                          className={`text-xs leading-5 font-semibold rounded-full px-2 py-1 focus:outline-none focus:ring-1 ${statusBadgeClass[message.status]}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="replied">Replied</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleMessageClick(message)}
                            className="text-blue-600 hover:text-blue-900 p-1 relative group"
                            title="View Details"
                          >
                            <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">View</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 relative group"
                            title="Delete Message"
                          >
                            <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col xs:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium">{(currentPage - 1) * 10 + messages.length}</span> of{' '}
              <span className="font-medium">{data?.count || (disableFetch ? localMessages?.length : messages.length)}</span> results
            </div>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-1 sm:p-2 border rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                <FiChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center px-2 text-xs sm:text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-1 sm:p-2 border rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                <FiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedMessage && (
          <MessageDetailsModal
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onStatusChange={updateStatus}
            onDelete={deleteMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;