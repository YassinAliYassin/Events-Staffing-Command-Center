import React, { useState, useEffect } from 'react';
import { CalendarPlus, User, Clock, Shirt, CheckCircle } from 'lucide-react';
import { BackendEvent } from '../types';

const STAFF_LIST = ['Mike', 'Alex', 'John', 'Sipho', 'Ben', 'David', 'Thabo', 'Kevin'];

const generateEventId = (): string => {
  const date = new Date();
  const yyyymmdd = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `FP-${yyyymmdd}-${random}`;
};

const EventForm: React.FC<{ onEventCreated?: () => void }> = ({ onEventCreated }) => {
  const [event, setEvent] = useState<Partial<BackendEvent>>({
    id: generateEventId(),
    duration: 4,
    dress_code: 'All Black',
    arrival_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Auto-set arrival time 1hr before event if date is set
    if (event.date && !event.arrival_time) {
      const eventDate = new Date(event.date);
      eventDate.setHours(eventDate.getHours() - 1);
      setEvent(prev => ({ ...prev, arrival_time: eventDate.toISOString().slice(0, 16) }));
    }
  }, [event.date]);

  const handleChange = (field: keyof BackendEvent, value: any) => {
    setEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!res.ok) throw new Error('Failed to create event');
      setSuccessMsg('Event created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setEvent({
        id: generateEventId(),
        title: '',
        date: '',
        duration: 4,
        staff_assigned: '',
        dress_code: 'All Black',
        arrival_time: ''
      });
      onEventCreated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg border border-gray-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CalendarPlus className="w-5 h-5 text-blue-400" />
        New Event Entry
      </h2>

      {successMsg && (
        <div className="bg-green-900/50 text-green-200 p-3 rounded mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
      {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event ID (read-only) */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Event ID</label>
          <input
            type="text"
            value={event.id || ''}
            readOnly
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Event Title</label>
          <input
            type="text"
            required
            value={event.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            placeholder="e.g. Corporate Gala 2026"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Event Date & Time</label>
          <input
            type="datetime-local"
            required
            value={event.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Duration (hrs)
          </label>
          <input
            type="number"
            min="1"
            value={event.duration || 4}
            onChange={(e) => handleChange('duration', Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Staff Assigned */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1">
            <User className="w-4 h-4" />
            Staff Assigned
          </label>
          <select
            required
            value={event.staff_assigned || ''}
            onChange={(e) => handleChange('staff_assigned', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select Staff</option>
            {STAFF_LIST.map(staff => (
              <option key={staff} value={staff}>{staff} {staff === 'Mike' ? '(Leader)' : ''}</option>
            ))}
          </select>
        </div>

        {/* Dress Code */}
        <div>
          <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1">
            <Shirt className="w-4 h-4" />
            Dress Code
          </label>
          <input
            type="text"
            value={event.dress_code || 'All Black'}
            onChange={(e) => handleChange('dress_code', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Arrival Time */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Arrival Time (1hr before)</label>
          <input
            type="datetime-local"
            value={event.arrival_time || ''}
            onChange={(e) => handleChange('arrival_time', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 min-h-[48px] transition-colors"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
};

export default EventForm;
