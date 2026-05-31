import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const ActiveEventsCounter = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveEvents = async () => {
      try {
        const res = await fetch('/api/events?status=active');
        const data = await res.json();
        setCount(data.length || 0);
      } catch (err) {
        console.error('Failed to fetch active events:', err);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveEvents();
    const interval = setInterval(fetchActiveEvents, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
      <div className="p-3 bg-blue-900/30 rounded-lg">
        <Calendar className="text-blue-400" size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-400">Active Events</p>
        {loading ? (
          <p className="text-2xl font-bold text-white">...</p>
        ) : (
          <p className="text-2xl font-bold text-white">{count}</p>
        )}
      </div>
    </div>
  );
};

export default ActiveEventsCounter;
