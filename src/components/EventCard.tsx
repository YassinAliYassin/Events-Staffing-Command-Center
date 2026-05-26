import React from 'react';
import { Calendar, User, Shirt, Clock, Trash2, Mail, MessageCircle, Users, Copy, CheckCircle, XCircle } from 'lucide-react';
import { BackendEvent } from '../types';

interface EventCardProps {
  event: BackendEvent;
  onDelete: (id: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onDelete }) => {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Check if we have any contact info to show actions
  const hasContactInfo = (event.assignedStaff && event.assignedStaff.length > 0) || event.staffName || event.clientName || event.clientPhone;
  const hasWhatsApp = event.staffPhone || (event.assignedStaff && event.assignedStaff.some(s => s.phone)) || event.clientPhone;
  const hasEmail = event.clientEmail; // Only client email for now

  // Get primary contact for WhatsApp/Email (first assigned staff or legacy)
  const getPrimaryContact = () => {
    if (event.assignedStaff && event.assignedStaff.length > 0) {
      return event.assignedStaff[0];
    }
    return null;
  };

  // Generate WhatsApp link
  const getWhatsAppLink = () => {
    const primary = getPrimaryContact();
    const phone = primary?.phone || event.staffPhone || event.clientPhone;
    if (!phone) return '#';
    const name = primary?.fullName || event.staffName || event.clientName || 'there';
    const role = primary?.role || '';
    const shiftType = primary?.shiftType || '';
    const shiftText = shiftType && shiftType !== 'Full Shift' ? ` (${shiftType})` : '';
    const text = `Hello ${name}${role ? ` (${role})` : ''}${shiftText}, regarding the ${event.title} on ${formatDate(event.date)}`;
    return `https://wa.me/${phone.replace(/\\D/g, '')}?text=${encodeURIComponent(text)}`;
  };

  // Generate Email link
  const getEmailLink = () => {
    const email = event.clientEmail; // Staff communication via WhatsApp only
    if (!email) return '#';
    const name = event.staffName || event.clientName || '';
    const subject = `Event Details: ${event.title}`;
    const body = `Hi ${name}, checking in on ${event.title} scheduled for ${formatDate(event.date)}`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Copy Dispatch Script to clipboard
  const copyDispatchScript = (staff: any) => {
    const script = `Hello ${staff.fullName},

Hope you're well! I'm confirming your assignment for the upcoming event:

📅 Event: ${event.title}
📆 Date: ${formatDate(event.date)}
⏰ Arrival: ${formatTime(event.arrivalTime)}
👔 Uniform: ${event.uniformType || event.dressCode}
🎭 Your Role: ${staff.role}${staff.shiftType && staff.shiftType !== 'Full Shift' ? ` (${staff.shiftType})` : ''}

Please confirm your availability by replying to this message.

Looking forward to a great event!

Best regards,
Fresh People Events Team`;

    navigator.clipboard.writeText(script).then(() => {
      alert('Dispatch script copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = script;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Dispatch script copied to clipboard!');
    });
  };

  // Update staff status
  const updateStaffStatus = async (staffId: number, status: 'Confirmed' | 'Unavailable') => {
    try {
      const response = await fetch(`http://${window.location.hostname}:3001/api/events/${event.id}/assignments/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        alert(`Staff marked as ${status}`);
        // Reload to reflect changes (simple approach)
        window.location.reload();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status');
    }
  };

  // Handle missing phone for WhatsApp
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    if (!hasWhatsApp) {
      e.preventDefault();
      alert('No phone number available. Please add contact info first.');
    }
  };

  // Handle missing email
  const handleEmailClick = (e: React.MouseEvent) => {
    if (!hasEmail) {
      e.preventDefault();
      alert('No email address available. Please add contact info first.');
    }
  };

  return (
    <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-blue-400">{event.id}</span>
        <button
          onClick={() => onDelete(event.id)}
          className="text-red-400 hover:text-red-300 p-2 -m-2"
          title="Delete event"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <h3 className="font-medium mb-2 text-base">{event.title}</h3>

      <div className="space-y-2 text-sm text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(event.date)}
        </div>
        
        {/* Staff Roster */}
        {event.assignedStaff && event.assignedStaff.length > 0 ? (
          <div className="flex items-start gap-1">
            <Users className="w-3 h-3 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-300">Staff Roster ({event.assignedStaff.length})</p>
              <div className="flex flex-col gap-2 mt-1">
                {event.assignedStaff.map(staff => (
                  <div key={staff.id} className="bg-gray-700 px-2 py-1 rounded flex items-center justify-between gap-2">
                    <span className="text-xs">
                      {`${staff.fullName} - ${staff.role}`}
                      {staff.shiftType && staff.shiftType !== 'Full Shift' && (
                        <span className="ml-1 text-blue-400">({staff.shiftType})</span>
                      )}
                      {staff.status && staff.status !== 'Pending' && (
                        <span className={`ml-1 ${staff.status === 'Confirmed' ? 'text-green-400' : 'text-red-400'}`}>
                          [{staff.status}]
                        </span>
                      )}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyDispatchScript(staff)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Copy dispatch script"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateStaffStatus(staff.id, 'Confirmed')}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Mark as Confirmed"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateStaffStatus(staff.id, 'Unavailable')}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Mark as Unavailable"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : event.staffName ? (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {event.staffName} (legacy)
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-500">
            <User className="w-3 h-3" />
            Unassigned
          </div>
        )}
        
        {event.clientName && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="w-3 h-3" />
            Client: {event.clientName}
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Shirt className="w-3 h-3" />
          {event.dressCode}
        </div>
        {event.uniformType && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            Uniform: {event.uniformType}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {event.duration}hr (Arrive: {formatTime(event.arrivalTime)})
        </div>
      </div>

      {/* Contact Action Row - only show if contact info exists */}
      {hasContactInfo && (
        <div className="flex items-center gap-3 pt-3 border-t border-gray-700">
          <a
            href={getWhatsAppLink()}
            onClick={handleWhatsAppClick}
            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors p-2 -m-2 min-h-[44px] min-w-[44px] justify-center"
            title="Contact via WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <a
            href={getEmailLink()}
            onClick={handleEmailClick}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors p-2 -m-2 min-h-[44px] min-w-[44px] justify-center"
            title="Contact via Email"
          >
            <Mail className="w-5 h-5" />
            <span className="hidden sm:inline">Email</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default EventCard;
