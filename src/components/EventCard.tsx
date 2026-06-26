import React from 'react';
import { Calendar, Trash2, CheckCircle, Clock, MessageSquare, Users } from 'lucide-react';
import { BackendEvent } from '../types';

interface EventCardProps {
  event: BackendEvent;
  onDelete: (id: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onDelete }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Confirmed') {
      return <CheckCircle size={14} className="text-green-400" />;
    }
    return <Clock size={14} className="text-yellow-400" />;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-white">{event.title}</h3>
        <button
          onClick={() => onDelete(event.id)}
          className="text-red-400 hover:text-red-300 p-1"
          title="Delete event"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>{formatDate(event.date)} ({event.duration}h)</span>
        </div>

        {event.dressCode && (
          <div className="text-gray-400">
            Dress: {event.dressCode}
          </div>
        )}

        {/* Assigned Staff with WhatsApp Status */}
        {event.assignedStaff && event.assignedStaff.length > 0 ? (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} />
              <span className="font-medium text-gray-200">Staff ({event.assignedStaff.length}):</span>
            </div>
            <div className="space-y-1">
              {event.assignedStaff.map((staff, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-900/50 rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-400" />
                    <span className="text-blue-300">{staff.fullName}</span>
                    <span className="text-xs text-gray-500">({staff.shiftType})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(staff.status)}
                    <span className={`text-xs ${
                      staff.status === 'Confirmed' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {staff.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : event.staffName ? (
          /* Legacy single staff display */
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span className="font-medium">Assigned:</span>
              <span className="text-blue-400">{event.staffName}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EventCard;
