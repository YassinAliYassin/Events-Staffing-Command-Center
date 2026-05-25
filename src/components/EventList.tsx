import React, { useState, useEffect } from 'react';
import { Calendar, User, Shirt, Clock, Trash2 } from 'lucide-react';
import { BackendEvent } from '../types';

const EventList: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/events`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await fetch(`http://localhost:3001/api/events/${id}`, { method: 'DELETE' });
      fetchEvents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshKey]);

  if (loading) return <div className="text-gray-400 p-6">Loading events...</div>;
  if (error) return <div className="text-red-400 p-6">{error}</div>;

  return (
      <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg border border-gray-800 max-h-[70vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-green-400" />
        Events ({events.length})
      </h2>

      {events.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No events yet. Create one above!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-blue-400">{event.id}</span>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-red-400 hover:text-red-300 p-2 -m-2"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-medium mb-2 text-base">{event.title}</h3>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.date).toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {event.staff_assigned}
                </div>
                <div className="flex items-center gap-1">
                  <Shirt className="w-3 h-3" />
                  {event.dress_code}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.duration}hr (Arrive: {new Date(event.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
