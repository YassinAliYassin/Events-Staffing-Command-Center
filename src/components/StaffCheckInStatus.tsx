import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';

const StaffCheckInStatus = () => {
  const [checkedIn, setCheckedIn] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/staff/check-in-status');
        const data = await res.json();
        setCheckedIn(data.checkedIn || 0);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Failed to fetch check-in status:', err);
        setCheckedIn(0);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
      <div className="p-3 bg-green-900/30 rounded-lg">
        <UserCheck className="text-green-400" size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-400">Staff Checked In</p>
        {loading ? (
          <p className="text-2xl font-bold text-white">...</p>
        ) : (
          <p className="text-2xl font-bold text-white">{checkedIn}/{total}</p>
        )}
      </div>
    </div>
  );
};

export default StaffCheckInStatus;
