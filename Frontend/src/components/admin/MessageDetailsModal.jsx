import { useState, useCallback, useMemo } from 'react';
import { FiMail, FiUser, FiClock, FiMessageSquare, FiTrash2, FiCheckCircle, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '@utils/api';

const statusBadgeClass = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-gray-100 text-gray-800',
  replied: 'bg-green-100 text-green-800',
  archived: 'bg-purple-100 text-purple-800'
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MessageDetailsModal = ({ message, onClose, onStatusChange, onDelete }) => {
  const { user, loading: authLoading } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [error, setError] = useState(null);

  const formattedDate = useMemo(() => formatDate(message?.created_at), [message?.created_at]);

  const handleReply = useCallback(async () => {
    if (replyContent.trim().length < 10) {
      toast.error('Reply must be at least 10 characters long');
      return;
    }

    setIsReplying(true);
    setError(null);
    try {
      await api.post('/contact-messages/reply/', {
        messageId: message.id,
        reply: replyContent
      });
      await onStatusChange(message.id, 'replied');
      setReplySent(true);
      toast.success(`Reply sent to ${message.email}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send reply';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsReplying(false);
    }
  }, [message, replyContent, onStatusChange]);

  const handleDelete = useCallback(() => {
    toast(
      <div>
        <p>Delete this message?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              onDelete(message.id);
              onClose();
              toast.dismiss();
              toast.success('Message deleted');
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
  }, [message, onDelete, onClose]);

  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await onStatusChange(id, status);
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  }, [onStatusChange]);

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-4">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || !message) return null;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b p-3 sm:p-4">
              <h2 className="text-lg sm:text-xl font-bold truncate">Message from {message.name}</h2>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 p-1"
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Main Content */}
            <div className="overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Sender Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-md sm:text-lg font-semibold flex items-center">
                  <FiUser className="mr-2" /> Sender
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Name</p>
                    <p className="text-sm sm:text-base">{message.name}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Email</p>
                    <a 
                      href={`mailto:${encodeURIComponent(message.email)}`} 
                      className="text-sm sm:text-base text-blue-600 hover:underline break-all"
                    >
                      {message.email}
                    </a>
                  </div>
                  {message.phone && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                      <a 
                        href={`tel:${encodeURIComponent(message.phone)}`} 
                        className="text-sm sm:text-base text-blue-600 hover:underline"
                      >
                        {message.phone}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Date Sent</p>
                    <p className="text-sm sm:text-base">{formattedDate}</p>
                  </div>
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-md sm:text-lg font-semibold flex items-center">
                  <FiMail className="mr-2" /> Details
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Subject</p>
                    <p className="text-sm sm:text-base font-medium">{message.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Status</p>
                    <div className="flex items-center mt-1">
                      <select
                        value={message.status}
                        onChange={(e) => handleStatusChange(message.id, e.target.value)}
                        className={`text-xs sm:text-sm border rounded px-2 py-1 ${statusBadgeClass[message.status]}`}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="archived">Archived</option>
                      </select>
                      {message.status === 'replied' && (
                        <FiCheckCircle className="ml-2 text-green-500" size={16} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="md:col-span-2">
                <h3 className="text-md sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
                  <FiMessageSquare className="mr-2" /> Message
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-sm sm:text-base whitespace-pre-line">{message.message}</p>
                </div>
              </div>

              {/* Reply Section */}
              {message.status !== 'replied' && !replySent ? (
                <div className="md:col-span-2">
                  <h3 className="text-md sm:text-lg font-semibold mb-2 sm:mb-3">Reply</h3>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 p-2 rounded-md mb-2 text-sm">
                      {error}
                      <button
                        onClick={handleReply}
                        className="ml-2 text-blue-600 underline text-xs"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply here (minimum 10 characters)..."
                    className="w-full h-24 sm:h-32 p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                  <div className="mt-2 sm:mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => setReplyContent('')}
                      className="px-3 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={isReplying || replyContent.trim().length < 10}
                      className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {isReplying && (
                        <svg
                          className="animate-spin h-4 w-4 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      {isReplying ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 p-3 sm:p-4 bg-green-50 rounded-lg flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-xs sm:text-sm text-green-800">
                    Reply sent to {message.email}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t p-3 sm:p-4 flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-0">
              <button
                onClick={handleDelete}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 flex items-center justify-center"
              >
                <FiTrash2 className="mr-1" size={14} /> Delete
              </button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {message.status !== 'replied' && !replySent && (
                  <button
                    onClick={() => handleStatusChange(message.id, 'replied')}
                    className="px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-green-700 flex items-center justify-center"
                  >
                    <FiCheckCircle className="mr-1" size={14} /> Mark Replied
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-3 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessageDetailsModal;