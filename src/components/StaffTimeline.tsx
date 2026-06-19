/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StaffTimeline — Visual timeline showing staff allocations for a selected day.
 * Makes double-bookings and conflicts immediately obvious with color-coded bars.
 */

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { Event, Staff, Client, Venue } from '../types';

interface StaffTimelineProps {
  events: Event[];
  staff: Staff[];
  clients: Client[];
  venues: Venue[];
  selectedDate: string; // YYYY-MM-DD
  onSelectEvent: (eventId: string) => void;
}

const StaffTimeline: React.FC<StaffTimelineProps> = ({
  events,
  staff,
  clients,
  venues,
  selectedDate,
  onSelectEvent,
}) => {
  const [highlightedStaff, setHighlightedStaff] = useState<string | null>(null);

  // Filter events for the selected day (local events only)
  const dayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDate && !e.id.startsWith('gcal-import') && !e.id.startsWith('apple-import') && !e.id.startsWith('apple-live'))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, selectedDate]);

  // Get all staff allocated on this day
  const activeStaffIds = useMemo(() => {
    const ids = new Set<string>();
    dayEvents.forEach((e) => e.staffIds.forEach((sId) => ids.add(sId)));
    return Array.from(ids);
  }, [dayEvents]);

  // Build timeline data: for each staff, their allocations with position info
  const timelineData = useMemo(() => {
    return activeStaffIds
      .map((staffId) => {
        const staffMember = staff.find((s) => s.id === staffId);
        if (!staffMember) return null;

        const allocations = dayEvents
          .filter((e) => e.staffIds.includes(staffId))
          .map((e) => {
            const client = clients.find((c) => c.id === e.clientId);
            const venue = venues.find((v) => v.id === e.venueId);
            const startMinutes = timeToMinutes(e.startTime);
            const endMinutes = timeToMinutes(e.endTime);
            const duration = Math.max(endMinutes - startMinutes, 30); // minimum 30 min block
            return {
              eventId: e.id,
              title: e.title,
              client: client?.name || 'Unknown',
              venue: venue?.name || 'Unknown',
              startMinutes,
              duration,
              status: e.status || 'Pending',
              hasConflict: false, // will be computed below
            };
          });

        // Detect conflicts within this staff's allocations
        for (let i = 0; i < allocations.length; i++) {
          for (let j = i + 1; j < allocations.length; j++) {
            const a = allocations[i];
            const b = allocations[j];
            if (a.startMinutes < b.startMinutes + b.duration && b.startMinutes < a.startMinutes + a.duration) {
              a.hasConflict = true;
              b.hasConflict = true;
            }
          }
        }

        return {
          staffId,
          name: `${staffMember.name} ${staffMember.surname}`,
          role: staffMember.role,
          allocations,
        };
      })
      .filter(Boolean) as Array<{
        staffId: string;
        name: string;
        role: string;
        allocations: Array<{
          eventId: string;
          title: string;
          client: string;
          venue: string;
          startMinutes: number;
          duration: number;
          status: string;
          hasConflict: boolean;
        }>;
      }>;
  }, [activeStaffIds, dayEvents, staff, clients, venues]);

  if (dayEvents.length === 0) {
    return (
      <div className="bg-slate-50/50 border border-slate-200/60 rounded-lg p-4 text-center">
        <Clock className="w-5 h-5 text-slate-300 mx-auto mb-2" />
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          No events scheduled for {formatDate(selectedDate)}
        </p>
      </div>
    );
  }

  const conflicts = timelineData.filter((s) => s.allocations.some((a) => a.hasConflict));

  return (
    <div className="bg-white border border-slate-200/60 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-700">
            Staff Timeline — {formatDate(selectedDate)}
          </span>
        </div>
        <span className="text-[9px] text-slate-400 font-mono">
          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} • {activeStaffIds.length} staff
        </span>
      </div>

      {/* Conflict warning banner */}
      {conflicts.length > 0 && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span className="text-[9px] text-red-700 uppercase tracking-wider font-bold">
            {conflicts.length} staff member{conflicts.length !== 1 ? 's' : ''} with double-bookings
          </span>
        </div>
      )}

      {/* Timeline grid */}
      <div className="p-3">
        {/* Time axis labels */}
        <div className="flex items-center mb-2 pl-[140px]">
          {Array.from({ length: 8 }, (_, i) => {
            const hour = 8 + i * 2; // 8am to 10pm
            if (hour > 22) return null;
            return (
              <div key={hour} className="flex-1 text-[8px] text-slate-400 font-mono text-center">
                {String(hour).padStart(2, '0')}:00
              </div>
            );
          })}
        </div>

        {/* Staff rows */}
        <div className="space-y-1">
          {timelineData.map((row) => (
            <div
              key={row.staffId}
              className={`flex items-center gap-2 py-1 rounded ${
                row.allocations.some((a) => a.hasConflict) ? 'bg-red-50/50' : ''
              }`}
            >
              {/* Staff name column */}
              <div
                className="w-[140px] flex-shrink-0 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 rounded px-1.5 py-0.5 transition-colors"
                onMouseEnter={() => setHighlightedStaff(row.staffId)}
                onMouseLeave={() => setHighlightedStaff(null)}
              >
                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold text-slate-700 truncate">{row.name}</div>
                  <div className="text-[7px] text-slate-400 truncate">{row.role}</div>
                </div>
              </div>

              {/* Timeline bar area */}
              <div className="flex-1 relative h-5 bg-slate-50 rounded-sm border border-slate-100">
                {row.allocations.map((alloc) => {
                  const left = `${(alloc.startMinutes / (24 * 60)) * 100}%`;
                  const width = `${(alloc.duration / (24 * 60)) * 100}%`;
                  const isHighlighted = highlightedStaff === row.staffId;

                  return (
                    <div
                      key={alloc.eventId}
                      className={`absolute top-0.5 bottom-0.5 rounded-sm cursor-pointer transition-all ${
                        alloc.hasConflict
                          ? 'bg-red-400/80 border border-red-500 z-10'
                          : alloc.status === 'Confirmed'
                          ? 'bg-emerald-400/70 border border-emerald-500'
                          : alloc.status === 'Canceled'
                          ? 'bg-slate-300/60 border border-slate-400'
                          : 'bg-amber-400/70 border border-amber-500'
                      } ${isHighlighted ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                      style={{ left: left as string, width: Math.max(parseFloat(width), 3) + '%' }}
                      onClick={() => onSelectEvent(alloc.eventId)}
                      title={`${alloc.title}\n${alloc.client} @ ${alloc.venue}\n${minutesToTime(alloc.startMinutes)} - ${minutesToTime(alloc.startMinutes + alloc.duration)}${alloc.hasConflict ? '\n⚠ CONFLICT' : ''}`}
                    >
                      <span className="absolute inset-0 flex items-center px-1 text-[7px] font-semibold text-white truncate drop-shadow-sm">
                        {alloc.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400/70 border border-amber-500"></div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider">Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/70 border border-emerald-500"></div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider">Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-400/80 border border-red-500"></div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider">Conflict</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-300/60 border border-slate-400"></div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider">Canceled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export default StaffTimeline;
