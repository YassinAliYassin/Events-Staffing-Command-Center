import React, { useState, useEffect, useMemo } from 'react';
import { Users, MapPin, DollarSign, RefreshCw } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
}

interface Venue {
  id: string;
  name: string;
  address: string;
}

interface Staff {
  id: string;
  name: string;
  role: 'individual' | 'specialist';
  phone: string;
  hourlyRate: number;
}

interface Event {
  id: string;
  title: string;
  clientId: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  staffIds: string[];
  notes: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

const Dashboard: React.FC<{
  staff: any[];
  events: any[];
  clients: any[];
  records: any[];
  now: number;
  addToast: (msg: string, type?: string) => void;
}> = ({ staff, events, clients, records, now, addToast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const todayStr = new Date(now).toISOString().slice(0, 10);
  
  const todayEvents = events.filter(e => e.date === todayStr);
  const confirmedToday = todayEvents.filter(e => e.status === 'Confirmed').length;
  const pendingToday = todayEvents.filter(e => e.status === 'Pending').length;
  
  const activeStaff = staff.filter(s => 
    records.some(r => r.staffId === s.id && !r.clockOut)
  ).length;
  
  const completedShifts = records.filter(r => r.clockOut);
  const totalHours = completedShifts.reduce((a, r) => a + (r.clockOut - r.clockIn) / 3600000, 0);
  
  const totalPayroll = completedShifts.reduce((a, r) => {
    const s = staff.find(x => x.id === r.staffId);
    return a + (r.clockOut - r.clockIn) / 3600000 * (s?.hourlyRate || 0);
  }, 0);

  const refresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsLoading(false);
      addToast('Refreshed', 'success');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Simple Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold-400">Dashboard</h1>
          <button 
            onClick={refresh}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={`text-gold-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* KPI Cards - Simplified */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Staff', value: staff.length, icon: <Users size={20} />, color: 'text-blue-400' },
            { label: 'Today', value: todayEvents.length, icon: <MapPin size={20} />, color: 'text-green-400' },
            { label: 'Active', value: activeStaff, icon: <Users size={20} />, color: 'text-gold-400' },
            { label: 'Payroll', value: `R${totalPayroll.toFixed(0)}`, icon: <DollarSign size={20} />, color: 'text-emerald-400' }
          ].map((kpi, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gray-800/50 ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Today's Events */}
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">Today</h3>
            {todayEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">No events</p>
            ) : (
              <div className="space-y-3">
                {todayEvents.slice(0, 5).map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      ev.status === 'Confirmed' ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ev.title}</p>
                      <p className="text-xs text-gray-400">{ev.startTime} - {ev.endTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Confirmed</span>
                  <span className="text-green-400">{confirmedToday}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Pending</span>
                  <span className="text-yellow-400">{pendingToday}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Hours</span>
                  <span className="text-gold-400">{totalHours.toFixed(1)}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Refresh */}
        <div className="mt-6 text-xs text-gray-600 text-right">
          {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
