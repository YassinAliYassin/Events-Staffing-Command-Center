import React, { useState, useEffect, useRef } from 'react';
import { CalendarPlus, User, Clock, CheckCircle, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { BackendEvent } from '../types';

const generateEventId = (): string => {
  const date = new Date();
  const yyyymmdd = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `FP-${yyyymmdd}-${random}`;
};

interface EventFormPolishedProps {
  onEventCreated?: () => void;
}

const EventFormPolished: React.FC<EventFormPolishedProps> = ({ onEventCreated }) => {
  const [event, setEvent] = useState<Partial<BackendEvent>>({
    id: generateEventId(),
    duration: 5,
  });
  const [staffList, setStaffList] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [staffAssigned, setStaffAssigned] = useState<number[]>([]);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [whatsappResults, setWhatsappResults] = useState<Array<{ staff: string; phone?: string; sent: boolean }>>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const dateRef = useRef<HTMLInputElement>(null);

  // Fetch staff from API
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/staff');
        const data = await res.json();
        setStaffList(data.staff || []);
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    };
    fetchStaff();
  }, []);

  const handleChange = (field: keyof BackendEvent, value: any) => {
    setEvent(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    if (!event.title?.trim()) {
      setError('Event title is required');
      return false;
    }
    if (!event.date) {
      setError('Event date & time is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setWhatsappResults([]);
    
    const dateValue = event.date || dateRef.current?.value || '';
    const payload = { 
      ...event,
      date: dateValue,
      staff_assigned: staffAssigned.map(id => 
        staffList.find(s => s.id === id)?.name || ''
      ).filter(Boolean),
      sendWhatsApp: sendWhatsApp
    };
    
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }
      
      const data = await res.json();
      
      let msg = 'Event created successfully!';
      if (data.whatsapp && data.whatsapp.length > 0) {
        setWhatsappResults(data.whatsapp);
        const sent = data.whatsapp.filter((r: any) => r.sent).length;
        msg += ` WhatsApp sent to ${sent}/${data.whatsapp.length} staff.`;
      }
      
      setSuccessMsg(msg);
      setEvent({ id: generateEventId(), duration: 5 });
      setStaffAssigned([]);
      setTimeout(() => setSuccessMsg(''), 5000);
      if (onEventCreated) onEventCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null;
    
    switch (field) {
      case 'title':
        return !event.title?.trim() ? 'Title is required' : null;
      case 'date':
        return !event.date ? 'Date & time is required' : null;
      default:
        return null;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 shadow-2xl">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 animate-pulse" />
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <CalendarPlus size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              New Event Entry
            </h2>
            <p className="text-gray-400 text-sm mt-1">Create and dispatch staff assignments</p>
          </div>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700/50 rounded-xl backdrop-blur-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-300 font-medium">{successMsg}</p>
                {whatsappResults.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {whatsappResults.map((r, i) => (
                      <div key={i} className={`text-sm flex items-center gap-2 ${r.sent ? 'text-green-400' : 'text-red-400'}`}>
                        <span>{r.sent ? '✓' : '✗'}</span>
                        <span>{r.staff}</span>
                        {r.phone && <span className="text-gray-500">({r.phone})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-rose-900/50 border border-red-700/50 rounded-xl backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event ID (Read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Event ID</label>
            <input
              type="text"
              value={event.id}
              disabled
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Event Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Event Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Corporate Gala 2026"
              value={event.title || ''}
              onChange={e => handleChange('title', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
              required
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                getFieldError('title') 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-gray-700/50 focus:ring-blue-500/50 focus:border-blue-500/50'
              }`}
            />
            {getFieldError('title') && (
              <p className="text-red-400 text-xs mt-1 animate-fade-in">{getFieldError('title')}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Event Date & Time <span className="text-red-400">*</span>
            </label>
            <input
              ref={dateRef}
              type="datetime-local"
              value={event.date || ''}
              onChange={e => handleChange('date', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, date: true }))}
              required
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                getFieldError('date') 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-gray-700/50 focus:ring-blue-500/50 focus:border-blue-500/50'
              }`}
            />
            {getFieldError('date') && (
              <p className="text-red-400 text-xs mt-1 animate-fade-in">{getFieldError('date')}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Duration (hours)</label>
            <input
              type="number"
              value={event.duration || 5}
              onChange={e => handleChange('duration', parseInt(e.target.value))}
              min={1}
              max={24}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
            />
          </div>

          {/* Staff Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Staff Assigned <span className="text-gray-500 font-normal">({staffAssigned.length} selected)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-800/30 border border-gray-700/30 rounded-xl">
              {staffList.map((staff) => {
                const isChecked = staffAssigned.includes(staff.id);
                return (
                  <label 
                    key={staff.id} 
                    className={`flex items-center gap-3 text-sm p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isChecked 
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' 
                        : 'bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let updated = [...staffAssigned];
                        if (e.target.checked) {
                          if (!updated.includes(staff.id)) updated.push(staff.id);
                        } else {
                          updated = updated.filter(id => id !== staff.id);
                        }
                        setStaffAssigned(updated);
                      }}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800 w-4 h-4"
                    />
                    <span className="font-medium">{staff.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Toggle */}
          <label className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl cursor-pointer hover:from-green-900/30 hover:to-emerald-900/30 transition-all duration-300">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="rounded border-green-600 text-green-600 focus:ring-green-500 bg-gray-800 w-5 h-5"
            />
            <MessageSquare size={20} className="text-green-400" />
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Send WhatsApp Notifications</p>
              <p className="text-gray-400 text-xs">Notify assigned staff instantly</p>
            </div>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Creating Event...</span>
              </>
            ) : (
              <>
                <CalendarPlus size={20} />
                <span>Create Event & Notify Staff</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventFormPolished;
