import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

const TeamAttendanceSummary = () => {
  const [attendance, setAttendance] = useState<{
    present: number;
    absent: number;
    late: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch('/api/staff/attendance/summary');
        const data = await res.json();
        setAttendance(data || { present: 0, absent: 0, late: 0, total: 0 });
      } catch (err) {
        console.error('Failed to fetch attendance summary:', err);
        setAttendance({ present: 0, absent: 0, late: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-purple-400" size={20} />
        <h3 className="font-medium text-white">Team Attendance</h3>
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : !attendance ? (
        <p className="text-gray-400 text-sm">No data available</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded p-2 text-center">
            <p className="text-xs text-gray-400">Present</p>
            <p className="text-lg font-bold text-green-400">{attendance.present}</p>
          </div>
          <div className="bg-gray-800/50 rounded p-2 text-center">
            <p className="text-xs text-gray-400">Absent</p>
            <p className="text-lg font-bold text-red-400">{attendance.absent}</p>
          </div>
          <div className="bg-gray-800/50 rounded p-2 text-center">
            <p className="text-xs text-gray-400">Late</p>
            <p className="text-lg font-bold text-yellow-400">{attendance.late}</p>
          </div>
          <div className="bg-gray-800/50 rounded p-2 text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-bold text-white">{attendance.total}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAttendanceSummary;
