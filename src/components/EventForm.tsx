import React, { useState, useEffect } from 'react';
import { CalendarPlus, User, Clock, Shirt, CheckCircle } from 'lucide-react';
import { BackendEvent } from '../types';

const STAFF_LIST = ['Mike Anderson', 'Alex Mthembu', 'John Sithole', 'Sipho Dube', 'Ben Marais', 'David Ndlovu', 'Thabo Molefe', 'Kevin Naidoo'];

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
  const [staffAssigned, setStaffAssigned] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
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
        body: JSON.stringify({ ...event, staff_assigned: staffAssigned })
      });
      if (!res.ok) throw new Error('Failed to create event');
      setSuccessMsg('Event created successfully!');
      setEvent({ id: generateEventId(), duration: 4, dress_code: 'All Black', arrival_time: '' });
      setStaffAssigned([]);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onEventCreated) onEventCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <CalendarPlus size={24} className="text-blue-400" />
        New Event Entry
      </h2>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-300">
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Event ID</label>
          <input
            type="text"
            value={event.id}
            disabled
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Event Title</label>
          <input
            type="text"
            placeholder="e.g. Corporate Gala 2026"
            value={event.title || ''}
            onChange={e => handleChange('title', e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Event Date & Time</label>
          <input
            type="datetime-local"
            value={event.date || ''}
            onChange={e => handleChange('date', e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Duration (hrs)</label>
          <input
            type="number"
            value={event.duration || 4}
            onChange={e => handleChange('duration', parseInt(e.target.value))}
            min={1}
            max={12}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Staff Assigned (Select All Applicable)</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 max-h-40 overflow-y-auto">
            {STAFF_LIST.map((staffName) => {
              const isChecked = staffAssigned.includes(staffName);
              return (
                <label key={staffName} className="flex items-center space-x-3 text-sm text-gray-200 cursor-pointer p-1.5 hover:bg-slate-800 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      let updated = [...staffAssigned];
                      if (e.target.checked) {
                        if (!updated.includes(staffName)) updated.push(staffName);
                      } else {
                        updated = updated.filter(name => name !== staffName);
                      }
                      setStaffAssigned(updated);
                    }}
                    className="rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-800 w-4 h-4"
                  />
                  <span>{staffName}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Dress Code</label>
          <input
            type="text"
            value={event.dress_code || 'All Black'}
            onChange={e => handleChange('dress_code', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Arrival Time (1hr before)</label>
          <input
            type="datetime-local"
            value={event.arrival_time || ''}
            onChange={e => handleChange('arrival_time', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
};

export default EventForm;
