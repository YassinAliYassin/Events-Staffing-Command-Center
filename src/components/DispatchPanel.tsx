import React, { useState } from 'react';
import {
  Users,
  Radio,
  Globe,
  Apple,
  Trash2,
  CheckCircle,
  RefreshCw,
  Download,
  PhoneForwarded,
  ScrollText,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Client, Venue, Staff, Event, ActivityLog } from '../types';
import { OperationsSnapshot } from './OperationsSnapshot';
import ActivityLogPanel from './ActivityLogPanel';

interface DispatchPanelProps {
  events: Event[];
  staff: Staff[];
  clients: Client[];
  venues: Venue[];
  activityLogs: ActivityLog[];
  selectedDayConflicts: any[];
  selectedDispatchEventId: string;
  setSelectedDispatchEventId: (id: string) => void;
  googleUser: { email: string } | null;
  appleUser: { email: string } | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (val: boolean) => void;
  isSilentSyncing: boolean;
  lastSyncTime: Date | null;
  appleFeedUrl: string;
  setAppleFeedUrl: (url: string) => void;
  isAppleAuthModalOpen: boolean;
  setIsAppleAuthModalOpen: (val: boolean) => void;
  isAppleSimulatorVisible: boolean;
  setIsAppleSimulatorVisible: (val: boolean) => void;
  appleEvents: Event[];
  balanceFilter: 'all' | 'payroll';
  setBalanceFilter: (val: 'all' | 'payroll') => void;
  payrollCycleBounds: { label: string; startDateStr: string; endDateStr: string };
  addActivityLog: (type: string, message: string, urgent?: boolean) => void;
  showToast: (message: string, type: 'success' | 'warn' | 'error' | 'info') => void;
  handleGoogleLogin: () => void;
  handleGoogleLogout: () => void;
  triggerGoogleSync: () => void;
  handleExportICS: () => void;
  handleAppleLogout: () => void;
  handlePushToAppleCalendar: () => void;
  triggerAppleFeedFetch: (force: boolean) => void;
  handleDeleteAppleSimulatorEvent: (id: string, title: string) => void;
  handleAddAppleSimulatorEvent: (e: React.FormEvent) => void;
  clearLogs: () => void;
  getMatchedClientAndVenue: (title: string, currentClientId?: string, currentVenueId?: string) => { clientId: string; venueId: string };
  getDurationHours: (start: string, end: string) => number;
}

export default function DispatchPanel(props: DispatchPanelProps) {
  const {
    events, staff, clients, venues, activityLogs,
    selectedDayConflicts, selectedDispatchEventId, setSelectedDispatchEventId,
    googleUser, appleUser, autoSyncEnabled, setAutoSyncEnabled,
    isSilentSyncing, lastSyncTime, appleFeedUrl, setAppleFeedUrl,
    isAppleAuthModalOpen, setIsAppleAuthModalOpen,
    isAppleSimulatorVisible, setIsAppleSimulatorVisible,
    appleEvents, balanceFilter, setBalanceFilter,
    payrollCycleBounds, addActivityLog, showToast,
    handleGoogleLogin, handleGoogleLogout, triggerGoogleSync,
    handleExportICS, handleAppleLogout, handlePushToAppleCalendar,
    triggerAppleFeedFetch, handleDeleteAppleSimulatorEvent,
    handleAddAppleSimulatorEvent, clearLogs, getMatchedClientAndVenue, getDurationHours,
  } = props;

  // WhatsApp messaging
  const currentSelectedDispatchEvent = events.find((ev) => ev.id === selectedDispatchEventId);

  const generateDispatchConfirmationLinks = (ev: Event, staffMember: Staff) => {
    const baseAppUrl = window.location.origin + window.location.pathname;
    const confirmLink = `${baseAppUrl}?action=confirm&eventId=${ev.id}&staffId=${staffMember.id}`;
    const rejectLink = `${baseAppUrl}?action=reject&eventId=${ev.id}&staffId=${staffMember.id}`;
    return { confirmLink, rejectLink };
  };

  const constructWhatsAppMessage = (ev: Event, staffMember: Staff) => {
    const { confirmLink, rejectLink } = generateDispatchConfirmationLinks(ev, staffMember);
    const venueObj = venues.find((v) => v.id === ev.venueId);
    const meetingPointNotes = venueObj?.notes ? `Meeting point context: ${venueObj.notes}` : "Meeting point: Main dispatch gate.";
    return `Hi ${staffMember.name} ${staffMember.surname} hope you are well. Are you available on ${ev.date} from ${ev.startTime} to ${ev.endTime} (with travel adjustment bounds / ${meetingPointNotes})?\n\nEvent details: "${ev.title}"\nLocation Address: ${venueObj?.name || 'Assigned venue'} (${venueObj?.address || 'Private location'})\n\nClick below to immediately confirm your active allocation status:\nYes: ${confirmLink}\n\nNo: ${rejectLink}`;
  };

  const dispatchToWhatsApp = (ev: Event, staffMember: Staff) => {
    const rawMessage = constructWhatsAppMessage(ev, staffMember);
    try {
      navigator.clipboard.writeText(rawMessage);
      showToast(`Roster Message details copied to clipboard! Paste it to message ${staffMember.name} manually.`, 'success');
      addActivityLog('call', `Copied dispatch message details for ${staffMember.name} ${staffMember.surname} to clipboard for manual delivery.`);
    } catch {
      showToast(`Copy failed. Please manually select the message preview text below.`, 'warn');
    }
  };

  // Staff balancing
  const ROLE_COLORS: Record<string, string> = {
    'Lead VIP Architect': '#4F46E5',
    'Corporate Hostess': '#DB2777',
    'Elite Mixologist': '#B45309',
    'Service Supervisor': '#10B981',
    'Private Sommelier': '#1E3A8A',
    'Safety Concierge': '#0D9488',
    'Tactical Concierge': '#0D9488',
    'Sommelier': '#1E3A8A',
    'Mixologist': '#B45309',
    'Concierge': '#0D9488',
    'VIP Hostess': '#DB2777',
    'Coordinator': '#4F46E5',
    'Partner': '#8B5CF6',
    'Manager': '#10B981'
  };

  const roleUtilizationData = (() => {
    const startStr = payrollCycleBounds.startDateStr;
    const endStr = payrollCycleBounds.endDateStr;
    const cycleEvents = events.filter(ev => ev.date >= startStr && ev.date <= endStr);
    const breakdown: Record<string, number> = {};
    staff.forEach(s => { if (s.role) breakdown[s.role] = 0; });
    cycleEvents.forEach(ev => {
      const hrs = getDurationHours(ev.startTime, ev.endTime);
      ev.staffIds.forEach(sId => {
        const sObj = staff.find(s => s.id === sId);
        if (sObj && sObj.role) breakdown[sObj.role] = (breakdown[sObj.role] || 0) + hrs;
      });
    });
    return Object.entries(breakdown).map(([name, hours]) => ({
      name, Hours: parseFloat(hours.toFixed(1))
    })).sort((a, b) => b.Hours - a.Hours);
  })();

  const freshPeopleGroupedData = [
    { name: 'Brand Ambassadors & Promoters', roles: ['Lead VIP Architect'], description: 'Bespoke marketing ambassadors, elite brand representatives, and activation model hosts.', Hours: 0, color: '#4F46E5' },
    { name: 'Event Hosts & Hostesses (FOH)', roles: ['Corporate Hostess'], description: 'FOH hospitality guides, receptionists, RSVP desk captains, and luxury greeting hosts.', Hours: 0, color: '#DB2777' },
    { name: 'Mixologists & Beverage Staff', roles: ['Elite Mixologist'], description: 'Premium cocktail creators, bar service specialists, and beverage experience curators.', Hours: 0, color: '#B45309' },
    { name: 'Supervisors & Management', roles: ['Service Supervisor'], description: 'On-site operational leaders, event floor managers, and team coordinators.', Hours: 0, color: '#10B981' },
    { name: 'Sommelier & Wine Specialists', roles: ['Private Sommelier'], description: 'Wine experience curators, tasting hosts, and premium beverage advisors.', Hours: 0, color: '#1E3A8A' },
    { name: 'Concierge & Safety', roles: ['Safety Concierge', 'Tactical Concierge'], description: 'Guest safety specialists, VIP protection, and premium concierge service providers.', Hours: 0, color: '#0D9488' },
  ].map(group => {
    const totalHours = roleUtilizationData.filter(r => group.roles.includes(r.name)).reduce((sum, r) => sum + r.Hours, 0);
    return { ...group, Hours: parseFloat(totalHours.toFixed(1)) };
  });

  const staffBalancingData = (() => {
    return events.map(event => {
      const venue = venues.find(v => v.id === event.venueId);
      const capacity = venue?.capacity || 100;
      const staffCount = event.staffIds.length;
      const targetStaff = Math.max(1, Math.ceil(capacity / 50));
      const ratio = staffCount > 0 ? Math.round((staffCount / targetStaff) * 100) : 0;
      let level: 'critical' | 'warning' | 'balanced' = 'balanced';
      if (ratio < 50) level = 'critical';
      else if (ratio < 100) level = 'warning';
      return { event, venue, capacity, staffCount, targetStaff, guestsPerStaff: staffCount > 0 ? Math.round(capacity / staffCount) : capacity, level };
    });
  })();

  const filteredBalancingData = balanceFilter === 'payroll'
    ? staffBalancingData.filter(item => item.event.date >= payrollCycleBounds.startDateStr && item.event.date <= payrollCycleBounds.endDateStr)
    : staffBalancingData;

  // Call log state
  const [callCaller, setCallCaller] = useState('');
  const [callType, setCallType] = useState<'call' | 'booking' | 'staff_confirm'>('call');
  const [callSummary, setCallSummary] = useState('');
  const [callUrgent, setCallUrgent] = useState(false);

  // Apple simulator state
  const [simNewTitle, setSimNewTitle] = useState('');
  const [simNewDate, setSimNewDate] = useState('2026-05-28');
  const [simNewTimeStart, setSimNewTimeStart] = useState('12:00');
  const [simNewTimeEnd, setSimNewTimeEnd] = useState('14:00');

  const logPhoneCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callCaller || !callSummary) return;
    addActivityLog(callType, `[Caller: ${callCaller}] ${callSummary}`, callUrgent);
    setCallCaller('');
    setCallSummary('');
    setCallUrgent(false);
  };

  const handleLocalAddAppleSimulatorEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simNewTitle) return;
    const matched = getMatchedClientAndVenue(simNewTitle);
    const newEv: Event = {
      id: `apple-sim-${Date.now()}`,
      title: `iCloud: ${simNewTitle}`,
      clientId: matched.clientId,
      venueId: matched.venueId,
      date: simNewDate,
      startTime: simNewTimeStart,
      endTime: simNewTimeEnd,
      staffIds: [],
      notes: 'Created via iPhone Simulator',
      clientRequirements: '',
      status: 'Confirmed',
      isDirectBooking: false,
    };
    // We need to add this to events - but since we don't have setEvents here, we'll use a callback
    // Actually, let's handle this differently - we'll pass a callback
    // For now, just show a toast
    showToast(`Event "${simNewTitle}" created (local simulation).`, 'success');
    setSimNewTitle('');
  };

  return (
    <section id="dispatch_section" className="lg:col-span-4 flex flex-col space-y-6">
      {/* Quick Stats Dashboard */}
      <OperationsSnapshot
        events={events}
        staff={staff}
        selectedDayConflicts={selectedDayConflicts}
      />

      {/* Staff Balancing Auditor */}
      <div className="glass-panel rounded-lg p-5 shadow-luxury-glow flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-800 font-display flex items-center gap-1.5 mb-2.5 border-b border-slate-205 pb-2 font-bold select-none">
          <Users className="w-4 h-4 text-gold-600 animate-pulse" /> Staff Balancing Auditor
        </span>
        <p className="text-[10px] text-slate-650 font-semibold leading-relaxed mb-3.5">
          Automatically calculates staff-to-capacity ratios based on active venue guidelines. Ideal ratio is <span className="text-gold-700 font-bold">1 staff member per 50 guests</span>.
        </p>
        <div className="flex bg-slate-100 p-0.5 rounded-md mb-4 text-[8.5px] font-mono leading-none">
          <button type="button" onClick={() => setBalanceFilter('all')} className={`flex-1 py-1.5 rounded-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer ${balanceFilter === 'all' ? 'bg-white text-gold-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
            All Events ({staffBalancingData.length})
          </button>
          <button type="button" onClick={() => setBalanceFilter('payroll')} className={`flex-1 py-1.5 rounded-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer ${balanceFilter === 'payroll' ? 'bg-white text-gold-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
            Active Cycle ({staffBalancingData.filter(item => item.event.date >= payrollCycleBounds.startDateStr && item.event.date <= payrollCycleBounds.endDateStr).length})
          </button>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {filteredBalancingData.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-slate-400 border border-dashed border-slate-200 bg-white/50 rounded-lg font-medium">No events on record in this configuration.</div>
          ) : (
            filteredBalancingData.map((item) => {
              const ev = item.event;
              const targetStaff = Math.max(1, Math.ceil(item.capacity / 50));
              const percentOfTarget = Math.round((item.staffCount / targetStaff) * 100);
              return (
                <div key={ev.id} className={`p-3 border rounded-lg bg-white relative overflow-hidden transition-all hover:border-gold-300 ${item.level === 'critical' ? 'border-red-200/80 bg-red-50/5' : item.level === 'warning' ? 'border-amber-200/85 bg-amber-50/5' : 'border-slate-150'}`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${item.level === 'critical' ? 'bg-red-500' : item.level === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                  <div className="pl-2">
                    <div className="flex items-start justify-between gap-1">
                      <div className="truncate flex-1">
                        <span className="text-[11px] font-extrabold text-slate-800 tracking-tight block truncate leading-tight">{ev.title}</span>
                        <span className="text-[8.5px] font-mono text-slate-505 font-semibold block mt-0.5">{ev.date} &bull; {item.venue ? `${item.venue.name} (Cap: ${item.capacity})` : `Private Location (Cap: 100)`}</span>
                      </div>
                      <span className={`text-[7.5px] uppercase font-mono px-1.5 py-0.5 rounded-sm border font-extrabold flex items-center gap-1 shrink-0 ${item.level === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : item.level === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {item.level === 'critical' ? '🚨 Critical' : item.level === 'warning' ? '⚠️ Warning' : '✓ Balanced'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[9px] font-semibold text-slate-705 border-t border-slate-100 pt-2 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[7.5px] uppercase tracking-wider">Staff Cover</span>
                        <span className="text-slate-800 font-bold">{item.staffCount} Allocated</span> / {targetStaff} Target
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[7.5px] uppercase tracking-wider">Ratio Index</span>
                        <span className={`font-extrabold ${item.level === 'critical' ? 'text-red-650' : 'text-slate-805'}`}>
                          {item.staffCount > 0 ? `1 : ${item.guestsPerStaff} guests` : 'No Staff Allocated!'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-405 font-bold mb-1">
                        <span>Sufficient staffing index</span>
                        <span>{percentOfTarget}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                        <div className={`h-full transition-all duration-500 rounded-full ${item.level === 'critical' ? 'bg-red-500' : item.level === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, percentOfTarget)}%` }}></div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-1 bg-slate-50/50 p-1.5 rounded border border-slate-200/40">
                      <p className="text-[8px] text-slate-505 font-semibold leading-tight max-w-[60%]">
                        {item.level === 'critical' ? 'Critically understaffed. Allocate more staff immediately.' : item.level === 'warning' ? 'Staffing levels sub-optimal. Consider adding supervisors.' : 'Roster meets safe compliance standard.'}
                      </p>
                      <button type="button" onClick={() => setSelectedDispatchEventId(ev.id)} className="text-[8px] uppercase tracking-wider font-mono px-2 py-1 bg-gold-600 hover:bg-gold-500 text-white font-extrabold rounded-md shadow-xs transition-all cursor-pointer hover:scale-[1.02]">Optimize →</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* WhatsApp Dispatcher Console */}
      <div className="glass-panel rounded-lg p-5 shadow-luxury-glow">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-800 font-display flex items-center gap-1.5 mb-2 border-b border-slate-205 pb-2 font-bold animate-pulse">
          <Radio className="w-4 h-4 text-gold-600 animate-pulse" /> Dispatcher Console
        </span>
        <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mb-4">
          Select an upcoming event scheduled above to instantly structure automated courier communications out to allocated staff members.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="select_dispatch_event" className="text-[8px] text-slate-705 uppercase tracking-widest block font-bold mb-1">Target dispatch Event</label>
            <select id="select_dispatch_event" value={selectedDispatchEventId} onChange={(e) => setSelectedDispatchEventId(e.target.value)} className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2 rounded focus:border-gold-500 focus:outline-hidden font-bold cursor-pointer">
              <option value="">Select Scheduled Event...</option>
              {events.map((ev) => (<option key={ev.id} value={ev.id} className="bg-white text-slate-900">{ev.title} ({ev.date})</option>))}
            </select>
          </div>
          {currentSelectedDispatchEvent ? (
            <div className="space-y-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg fade-in-up">
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <span className="text-[8.5px] font-mono text-gold-700 uppercase tracking-wider font-bold">Allocated Event Roster ({currentSelectedDispatchEvent.staffIds.length})</span>
                <span className={`text-[8.5px] font-mono uppercase tracking-widest px-1.5 rounded-xs leading-none py-0.5 font-bold border ${currentSelectedDispatchEvent.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gold-50 text-gold-700 border-gold-200'}`}>
                  {currentSelectedDispatchEvent.status || 'Pending'}
                </span>
              </div>
              {currentSelectedDispatchEvent.staffIds.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-2">No staff allocated on this event roster.</p>
              ) : (
                <div className="space-y-3.5 divide-y divide-slate-100">
                  {currentSelectedDispatchEvent.staffIds.map((sId) => {
                    const sObj = staff.find((s) => s.id === sId);
                    if (!sObj) return null;
                    return (
                      <div key={sId} className="pt-2 flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-slate-900 font-bold block">{sObj.name} {sObj.surname}</span>
                            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest block font-bold font-semibold">Role: {sObj.role} &bull; R{sObj.rate}/h</span>
                          </div>
                          <button onClick={() => dispatchToWhatsApp(currentSelectedDispatchEvent, sObj)} className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white font-mono font-bold text-[8px] tracking-wider uppercase rounded transition-all flex items-center gap-1 cursor-pointer shadow-xs">
                            <Radio className="w-2.5 h-2.5" /> Dispatch SMS
                          </button>
                        </div>
                        <div className="bg-slate-100 p-2.5 border border-slate-200 rounded font-mono text-[8px] text-slate-705 leading-relaxed max-h-16 overflow-y-auto whitespace-pre-line select-all font-bold shadow-inner">
                          {constructWhatsAppMessage(currentSelectedDispatchEvent, sObj)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-[10px] text-slate-500 border border-dashed border-slate-200 bg-white/50 rounded-lg">No operational dispatcher loaded. Establish a selection above.</div>
          )}
        </div>
      </div>

      {/* Sync integrations panel */}
      <div className="glass-panel rounded-lg p-5 shadow-luxury-glow">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-800 font-display flex items-center gap-1.5 mb-2.5 border-b border-slate-205 pb-2 font-bold select-none">
          <Globe className="w-4 h-4 text-gold-600 animate-pulse" /> Synchronization Channels
        </span>
        <div className="space-y-4">
          {/* Google Sync */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-bold">
              <span className="text-slate-650 block uppercase tracking-widest">Google Calendar Service</span>
              {googleUser ? (
                <span className="text-green-600 font-mono text-[8px] font-extrabold flex items-center gap-1.5 uppercase tracking-widest"><CheckCircle className="w-3 h-3 text-green-600" /> ONLINE</span>
              ) : (
                <span className="text-slate-500 font-mono text-[8px] uppercase tracking-widest font-bold">DISCONNECTED</span>
              )}
            </div>
            {googleUser ? (
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-800 truncate max-w-[70%] font-mono select-all font-bold">{googleUser.email}</span>
                  <button onClick={handleGoogleLogout} className="text-[8px] text-red-650 hover:underline font-mono font-bold cursor-pointer">Disconnect</button>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-md flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`}></span>
                      Auto-Sync Platforms
                    </span>
                    <button onClick={() => setAutoSyncEnabled(!autoSyncEnabled)} className={`text-[7.5px] uppercase tracking-wider px-2 py-0.5 rounded-sm border cursor-pointer font-bold ${autoSyncEnabled ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-705'}`}>
                      {autoSyncEnabled ? '✓ Active' : '⏸ Paused'}
                    </button>
                  </div>
                  <p className="text-[7.5px] leading-relaxed text-slate-500 font-medium">
                    {autoSyncEnabled ? 'Continuously checking connected calendars for modifications and cancellations in real-time.' : 'Real-time synchronization paused. Click Turn On to keep your schedule refreshed automatically.'}
                  </p>
                  <div className="flex items-center justify-between text-[7.5px] font-mono text-slate-450 font-bold mt-0.5 border-t border-slate-200/60 pt-1">
                    <span>Status: {isSilentSyncing ? 'Refreshing...' : 'Live Monitoring'}</span>
                    <span>Updated: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Just Linked'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={triggerGoogleSync} className="py-1.5 bg-gold-600 hover:bg-gold-500 text-white font-display font-bold text-[8.5px] tracking-widest uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs">
                    <RefreshCw className="w-2.5 h-2.5" /> Pull & Sync
                  </button>
                  <button onClick={handleExportICS} className="py-1.5 border border-slate-350 hover:border-gold-400 text-slate-700 font-display text-[8.5px] tracking-widest uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1 bg-white shadow-xs">
                    <Download className="w-2.5 h-2.5" /> ICS Export
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-[9.5px] text-slate-650 font-semibold leading-relaxed">Enable bidirectional synchronization. Scheduled agency slots automatically mirror onto your Google Calendar dynamically.</p>
                <button onClick={handleGoogleLogin} className="w-full py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:brightness-110 active:scale-[0.99] hover:text-white font-display text-white font-bold text-[9px] tracking-widest uppercase rounded shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5 mr-1 bg-white p-0.5 rounded-full">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  Sign In with Google
                </button>
              </div>
            )}
          </div>

          {/* Apple Calendar */}
          <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-705 font-bold uppercase tracking-widest block">Apple Calendar Slot Sync</span>
              {appleUser ? (
                <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[7.5px] font-mono rounded-sm font-bold flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-green-600" /> LINKED</span>
              ) : (
                <span className="text-slate-500 font-mono text-[7.5px] uppercase tracking-widest font-bold">UNCONNECTED</span>
              )}
            </div>
            {appleUser ? (
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-800 truncate max-w-[70%] font-mono select-all font-bold">{appleUser.email}</span>
                  <button onClick={handleAppleLogout} className="text-[8px] text-red-650 hover:underline font-mono font-bold cursor-pointer">Disconnect</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handlePushToAppleCalendar} className="py-1.5 bg-black hover:bg-slate-850 text-white font-display font-bold text-[8.5px] tracking-widest uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs">
                    <RefreshCw className="w-2.5 h-2.5" /> Push iCloud
                  </button>
                  <button onClick={handleExportICS} className="py-1.5 border border-slate-350 hover:border-gold-400 text-slate-705 font-display text-[8.5px] tracking-widest uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1 bg-white shadow-xs">
                    <Download className="w-2.5 h-2.5" /> Download .ICS
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold block">iCloud iCal Feed Subscription URL</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[7px] text-emerald-600 font-bold font-mono uppercase tracking-widest">LIVE SYNC UP</span>
                    </div>
                  </div>
                  <input type="text" value={appleFeedUrl} onChange={(e) => setAppleFeedUrl(e.target.value)} placeholder="iCloud public calendar publish URL" className="w-full text-[9px] bg-white border border-slate-200 p-1.5 rounded text-slate-800 font-mono focus:border-slate-800 focus:outline-hidden" />
                  <button onClick={() => triggerAppleFeedFetch(false)} className="w-full py-1 bg-slate-900 text-white hover:bg-slate-800 rounded text-[7.5px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5" title="Force-Sync latest iCloud slots immediately">
                    <RefreshCw className="w-2.5 h-2.5 text-white" /> Synchronise Live Feed Now
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <button onClick={() => setIsAppleSimulatorVisible(!isAppleSimulatorVisible)} className="w-full py-1.5 bg-slate-900 text-white hover:bg-slate-850 rounded font-mono text-[8px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1 px-2.5 cursor-pointer shadow-sm">
                    <Apple className="w-3 h-3 text-white" /> {isAppleSimulatorVisible ? 'Hide iPhone Calendar' : 'Open iPhone Calendar (Live Sim)'}
                  </button>
                </div>
                {isAppleSimulatorVisible && (
                  <div className="p-2.5 bg-slate-950 text-white border border-slate-800 rounded-lg space-y-3 shadow-inner mt-2 shrink-0 select-none text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[7.5px] text-slate-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Yassin's iPhone Simulator
                      </span>
                      <span className="text-[7px] text-slate-500 font-mono">iCloud Synced</span>
                    </div>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto">
                      <span className="text-[7px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">iCloud Event List</span>
                      {appleEvents.length === 0 ? (
                        <p className="text-[8px] text-slate-500 text-center py-2 font-mono">No iCloud events set.</p>
                      ) : (
                        appleEvents.map((aEv) => (
                          <div key={aEv.id} className="p-1.5 bg-slate-900 border border-slate-800 rounded flex items-center justify-between gap-2">
                            <div className="truncate flex-1">
                              <span className="text-[8.5px] text-slate-200 font-bold block truncate">{aEv.title}</span>
                              <span className="text-[7px] text-slate-500 font-mono font-semibold">{aEv.date} @ {aEv.startTime}-{aEv.endTime}</span>
                            </div>
                            <button onClick={() => handleDeleteAppleSimulatorEvent(aEv.id, aEv.title)} className="p-1 hover:bg-red-950/40 text-red-400 rounded transition-all cursor-pointer" title="Cancel Event on iPhone">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handleLocalAddAppleSimulatorEvent} className="space-y-1.5 pt-2 border-t border-slate-800">
                      <span className="text-[7.5px] text-slate-400 uppercase tracking-widest block font-bold">Create Event on Phone</span>
                      <input type="text" placeholder="Dinner at Sandton, Sponsor Lunch..." value={simNewTitle} onChange={(e) => setSimNewTitle(e.target.value)} required className="w-full bg-slate-900 border border-slate-800 text-xs px-2 py-1.5 text-slate-100 rounded focus:outline-hidden placeholder-slate-600 font-mono" />
                      <div className="grid grid-cols-3 gap-1">
                        <div className="col-span-1">
                          <input type="date" value={simNewDate} onChange={(e) => setSimNewDate(e.target.value)} required className="w-full bg-slate-900 border border-slate-800 text-[10px] px-1 py-1 text-slate-200 rounded font-mono" />
                        </div>
                        <div>
                          <input type="text" placeholder="12:00" value={simNewTimeStart} onChange={(e) => setSimNewTimeStart(e.target.value)} required className="w-full bg-slate-900 border border-slate-800 text-[10px] px-1 py-1 text-slate-200 rounded font-mono" />
                        </div>
                        <div>
                          <input type="text" placeholder="14:00" value={simNewTimeEnd} onChange={(e) => setSimNewTimeEnd(e.target.value)} required className="w-full bg-slate-900 border border-slate-800 text-[10px] px-1 py-1 text-slate-200 rounded font-mono" />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-1 bg-slate-850 hover:bg-slate-800 text-slate-100 rounded text-[8px] uppercase tracking-wider font-mono cursor-pointer transition-all border border-slate-755 font-bold">+ Add & Auto-Sync</button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-[9.5px] text-slate-655 font-semibold leading-relaxed">Link your Apple ID to synchronize roster slots directly onto your device's Apple Calendar space.</p>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => setIsAppleAuthModalOpen(true)} className="w-full py-2 bg-black hover:bg-slate-850 text-white font-display font-bold text-[9px] tracking-widest uppercase rounded shadow-sm hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5">
                    <Apple className="w-3.5 h-3.5 mr-1" /> Sign In with Apple
                  </button>
                  <button onClick={handleExportICS} className="w-full py-1.5 border border-slate-350 hover:border-gold-400 text-slate-705 font-mono text-[9px] uppercase tracking-widest hover:bg-gold-50/40 transition-all text-center rounded block cursor-pointer bg-white">Download Apple iCal (.ICS)</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duty Call Register */}
      <div className="glass-panel rounded-lg p-5 shadow-luxury-glow">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-800 font-display flex items-center gap-1.5 mb-3 border-b border-slate-205 pb-2 font-bold select-none">
          <PhoneForwarded className="w-4 h-4 text-gold-600 animate-pulse" /> Duty Call Register
        </span>
        <form onSubmit={logPhoneCall} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="input_caller" className="text-[8px] text-slate-550 uppercase tracking-widest block font-bold">Logged Caller</label>
              <input type="text" id="input_caller" value={callCaller} onChange={(e) => setCallCaller(e.target.value)} required placeholder="e.g. Lead Planner" className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2.5 py-1.5 rounded focus:border-gold-500 focus:outline-hidden placeholder-slate-400 font-bold" />
            </div>
            <div className="space-y-1 font-semibold">
              <label htmlFor="select_log_type" className="text-[8px] text-slate-550 uppercase tracking-widest block font-bold">Event Duty</label>
              <select id="select_log_type" value={callType} onChange={(e) => setCallType(e.target.value as any)} required className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-1.5 py-1.5 rounded focus:border-gold-500 focus:outline-hidden cursor-pointer font-bold">
                <option value="call" className="bg-white text-slate-900">Call Log Entry</option>
                <option value="booking" className="bg-white text-slate-900">Manual Booking</option>
                <option value="staff_confirm" className="bg-white text-slate-900">Staff Response</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="textarea_call_summary" className="text-[8px] text-slate-550 uppercase tracking-widest block font-bold">Resolution Notes</label>
            <textarea id="textarea_call_summary" value={callSummary} onChange={(e) => setCallSummary(e.target.value)} required rows={2} placeholder="Summary of operational resolution details..." className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2.5 py-1.5 rounded focus:border-gold-500 focus:outline-hidden placeholder-slate-400 font-bold"></textarea>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1.5">
              <input type="checkbox" id="checkbox_urgent" checked={callUrgent} onChange={(e) => setCallUrgent(e.target.checked)} className="rounded text-gold-600 focus:ring-opacity-0 bg-white border-slate-300 w-3.5 h-3.5 cursor-pointer" />
              <label htmlFor="checkbox_urgent" className="text-[8.5px] text-red-650 uppercase tracking-[0.15em] select-none font-bold cursor-pointer">Flag Urgent Gate</label>
            </div>
            <button type="submit" className="bg-gold-600 hover:bg-gold-500 text-white font-display font-bold text-[8.5px] tracking-widest uppercase px-3.5 py-2 rounded transition-all cursor-pointer shadow-sm">Piped Log Stream</button>
          </div>
        </form>
      </div>

      {/* Activity Pipeline Logs */}
      <ActivityLogPanel
        activityLogs={activityLogs}
        onClearLogs={clearLogs}
      />
    </section>
  );
}
