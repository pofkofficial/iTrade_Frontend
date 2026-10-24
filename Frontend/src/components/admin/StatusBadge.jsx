// components/StatusBadge.js
const StatusBadge = ({ status }) => {
    const statusMap = {
      new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
      read: { color: 'bg-gray-100 text-gray-800', label: 'Read' },
      replied: { color: 'bg-green-100 text-green-800', label: 'Replied' },
      archived: { color: 'bg-purple-100 text-purple-800', label: 'Archived' }
    };
  
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${statusMap[status]?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusMap[status]?.label || status}
      </span>
    );
  };
  
  export default StatusBadge;