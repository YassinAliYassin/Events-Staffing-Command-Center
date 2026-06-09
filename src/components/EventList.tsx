import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { BackendEvent } from '../types';
import EventCard from './EventCard';

const EventList: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const eventToken = localStorage.getItem('fpcc_admin_token');
      const res = await fetch(`/api/events/${deleteTarget.id}`, { 
        method: 'DELETE',
        headers: eventToken ? { 'Authorization': `Bearer ${eventToken}` } : {}
      });
      if (!res.ok) throw new Error('Failed to delete event');
      setDeleteTarget(null);
      fetchEvents();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
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
            <EventCard 
              key={event.id} 
              event={event} 
              onDelete={(id) => setDeleteTarget({ id, title: event.title })} 
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">Delete Event</h3>
            <p className="text-gray-400 mb-1">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteTarget.title}"</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
