/**
 * StaffAvailabilityPanel Component
 * Extracted dashboard widget showing staff RSVP overview, availability summary,
 * and upcoming assignments with quick bulk actions.
 */

import React, { useState, useMemo } from 'react';
import { Users, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Calendar, UserCheck } from 'lucide-react';
import type { Event, Staff, Client, Venue } from '../types';

export interface StaffAvailabilityPanelProps {
  staff: Staff[];
  events: Event[];
  clients: Client[];
  venues: Venue[];
  bulkUpdateRSVP: (eventId: string, state: 'Available' | 'Unavailable') => void;
}

type RSVPCounts = { Available: number; Pending: number; Unavailable: number };

export default function StaffAvailabilityPanel({
  staff,
  events,
  clients,
  venues,
  bulkUpdateRSVP,
}: StaffAvailabilityPanelProps) {
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [showAllStaff, setShowAllStaff] = useState(false);

  // Only local events (not Google/Apple imports) with RSVPs
  const localEvents = useMemo(
    () => events.filter((e) => !e.googleEventId && !e.appleEventId),
    [events]
  );

  // Upcoming events (today or future), sorted by date
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return localEvents
      .filter((e) => e.date >= today && e.status !== 'Canceled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [localEvents]);

  // Per-staff RSVP summary across all upcoming events
  const staffRSVPMap = useMemo(() => {
    const map = new Map<string, { counts: RSVPCounts; events: Event[] }>();
    staff.forEach((s) => {
      map.set(s.id, {
        counts: { Available: 0, Pending: 0, Unavailable: 0 },
        events: [],
      });
    });
    upcomingEvents.forEach((ev) => {
      ev.staffIds.forEach((sId) => {
        const entry = map.get(sId);
        if (!entry) return;
        const rsvp = ev.staffRSVPs?.[sId] || 'Pending';
        entry.counts[rsvp]++;
        entry.events.push(ev);
      });
    });
    return map;
  }, [staff, upcomingEvents]);

  // Overall availability summary
  const totalRSVPs = useMemo(() => {
    const totals: RSVPCounts = { Available: 0, Pending: 0, Unavailable: 0 };
    staffRSVPMap.forEach((entry) => {
      totals.Available += entry.counts.Available;
      totals.Pending += entry.counts.Pending;
      totals.Unavailable += entry.counts.Unavailable;
    });
    return totals;
  }, [staffRSVPMap]);

  const totalAssigned = totalRSVPs.Available + totalRSVPs.Pending + totalRSVPs.Unavailable;

  // Staff with pending responses (need attention)
  const staffWithPending = useMemo(() => {
    return staff.filter((s) => {
      const entry = staffRSVPMap.get(s.id);
      return entry && entry.counts.Pending > 0;
    });
  }, [staff, staffRSVPMap]);

  // Staff sorted by those with pending first, then by name
  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => {
      const aPending = staffRSVPMap.get(a.id)?.counts.Pending || 0;
      const bPending = staffRSVPMap.get(b.id)?.counts.Pending || 0;
      if (aPending !== bPending) return bPending - aPending; // pending first
      return a.name.localeCompare(b.name);
    });
  }, [staff, staffRSVPMap]);

  const displayedStaff = showAllStaff ? sortedStaff : sortedStaff.slice(0, 6);

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.name || 'Unknown Client';
  const getVenueName = (venueId: string) => venues.find((v) => v.id === venueId)?.name || 'Unknown Venue';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="glass-panel rounded-lg p-5 shadow-luxury-glow flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 border-b border-slate-200/60 pb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-800 font-display flex items-center gap-1.5 font-bold">
          <Users className="w-4 h-4 text-gold-600" /> Staff Availability
        </span>
        <span className="font-mono text-[8.5px] px-2 py-0.5 bg-gold-50 border border-gold-200/40 rounded-full text-gold-700 uppercase tracking-widest font-bold">
          {upcomingEvents.length} upcoming
        </span>
      </div>

      {/* Summary bar */}
      {totalAssigned > 0 && (
        <div className="mb-4 p-3 bg-slate-50/80 rounded-md border border-slate-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">RSVP Overview</span>
            <span className="text-[9px] font-mono text-slate-400">{totalAssigned} total</span>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-mono font-bold text-emerald-700">{totalRSVPs.Available}</span>
              <span className="text-[8px] text-slate-400 uppercase">Avail</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-mono font-bold text-amber-700">{totalRSVPs.Pending}</span>
              <span className="text-[8px] text-slate-400 uppercase">Pend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-mono font-bold text-red-700">{totalRSVPs.Unavailable}</span>
              <span className="text-[8px] text-slate-400 uppercase">Unavail</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
            {totalRSVPs.Available > 0 && (
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(totalRSVPs.Available / totalAssigned) * 100}%` }}
              />
            )}
            {totalRSVPs.Pending > 0 && (
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${(totalRSVPs.Pending / totalAssigned) * 100}%` }}
              />
            )}
            {totalRSVPs.Unavailable > 0 && (
              <div
                className="bg-red-400 h-full transition-all"
                style={{ width: `${(totalRSVPs.Unavailable / totalAssigned) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Pending attention banner */}
      {staffWithPending.length > 0 && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200/60 rounded-md">
          <div className="flex items-center gap-1.5 mb-1">
            <UserCheck className="w-3 h-3 text-amber-600" />
            <span className="text-[9px] uppercase tracking-widest text-amber-700 font-bold">
              Awaiting Response — {staffWithPending.length} staff
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {staffWithPending.map((s) => {
              const pendingCount = staffRSVPMap.get(s.id)?.counts.Pending || 0;
              return (
                <button
                  key={s.id}
                  onClick={() => setExpandedStaffId(expandedStaffId === s.id ? null : s.id)}
                  className="text-[8px] font-mono px-1.5 py-0.5 bg-amber-100 border border-amber-300/50 rounded text-amber-800 hover:bg-amber-200 transition-all cursor-pointer font-semibold"
                >
                  {s.name} ({pendingCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff list */}
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
        {displayedStaff.map((s) => {
          const entry = staffRSVPMap.get(s.id);
          if (!entry) return null;
          const { counts, events: staffEvents } = entry;
          const total = counts.Available + counts.Pending + counts.Unavailable;
          if (total === 0) return null;

          const isExpanded = expandedStaffId === s.id;

          return (
            <div key={s.id} className="border border-slate-200/50 rounded-md overflow-hidden">
              {/* Staff row */}
              <button
                onClick={() => setExpandedStaffId(isExpanded ? null : s.id)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50/80 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gold-50 border border-gold-200/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-gold-700">
                      {s.name[0]}{s.surname[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-800 truncate">{s.name} {s.surname}</div>
                    <div className="text-[8px] text-slate-400 font-mono truncate">{s.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {counts.Available > 0 && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded font-bold">
                      ✓{counts.Available}
                    </span>
                  )}
                  {counts.Pending > 0 && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 rounded font-bold">
                      ?{counts.Pending}
                    </span>
                  )}
                  {counts.Unavailable > 0 && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200/50 rounded font-bold">
                      ✗{counts.Unavailable}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded: upcoming assignments */}
              {isExpanded && staffEvents.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-1.5">
                  {staffEvents.slice(0, 5).map((ev) => {
                    const rsvp = ev.staffRSVPs?.[s.id] || 'Pending';
                    return (
                      <div key={ev.id} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200/40">
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-slate-700 truncate">{ev.title}</div>
                          <div className="text-[8px] text-slate-400 font-mono truncate">
                            {formatDate(ev.date)} · {ev.startTime}–{ev.endTime} · {getVenueName(ev.venueId)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            rsvp === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : rsvp === 'Unavailable'
                              ? 'bg-red-50 text-red-700 border border-red-200/50'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                          }`}>
                            {rsvp}
                          </span>
                          {rsvp === 'Pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                bulkUpdateRSVP(ev.id, 'Available');
                              }}
                              className="text-[7px] font-mono px-1 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300/50 rounded hover:bg-emerald-200 transition-all cursor-pointer font-bold"
                              title="Mark all staff Available for this event"
                            >
                              ✓ All
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {staffEvents.length > 5 && (
                    <div className="text-[8px] text-slate-400 text-center font-mono">
                      +{staffEvents.length - 5} more assignments
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less toggle */}
      {sortedStaff.length > 6 && (
        <button
          onClick={() => setShowAllStaff(!showAllStaff)}
          className="mt-2 w-full text-[9px] font-mono text-gold-600 hover:text-gold-700 uppercase tracking-widest py-1.5 border border-dashed border-gold-300/40 rounded hover:bg-gold-50/50 transition-all cursor-pointer font-semibold"
        >
          {showAllStaff ? 'Show Less' : `Show All ${sortedStaff.length} Staff`}
        </button>
      )}

      {/* Empty state */}
      {upcomingEvents.length === 0 && (
        <div className="text-center py-6">
          <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-[10px] text-slate-400 font-medium">No upcoming events scheduled</p>
          <p className="text-[8px] text-slate-300 mt-1">Staff availability will appear here</p>
        </div>
      )}
    </div>
  );
}
