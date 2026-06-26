import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpcomingBookingsList = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/events?status=upcoming&limit=5');
        const data = await res.json();
        setBookings(data || []);
      } catch (err) {
        console.error('Failed to fetch upcoming bookings:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-yellow-400" size={20} />
        <h3 className="font-medium text-white">Upcoming Bookings</h3>
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-400 text-sm">No upcoming bookings</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
              <Link to={`/events`} className="hover:text-blue-400 transition-colors">
                <p className="font-medium text-white text-sm">{booking.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(booking.start_time).toLocaleDateString()} • {booking.location || 'No location'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingBookingsList;
