/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Event, Staff } from '../types';

interface ConflictInfo {
  staffName: string;
  staffRole: string;
  eventA: { title: string; date: string; startTime: string; endTime: string };
  eventB: { title: string; date: string; startTime: string; endTime: string };
}

interface OperationsSnapshotProps {
  events: Event[];
  staff: Staff[];
  selectedDayConflicts: ConflictInfo[];
}

export const OperationsSnapshot: React.FC<OperationsSnapshotProps> = ({
  events,
  staff,
  selectedDayConflicts,
}) => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  const upcomingCount = events.filter(
    (e) => e.date >= todayStr && e.date <= nextWeekStr && e.status !== 'Canceled'
  ).length;

  const confirmedCount = events.filter((e) => e.status === 'Confirmed').length;
  const pendingCount = events.filter((e) => e.status === 'Pending' || !e.status).length;
  const canceledCount = events.filter((e) => e.status === 'Canceled').length;

  return (
    <div className="glass-panel rounded-lg p-5 shadow-luxury-glow flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-800 font-display flex items-center gap-1.5 mb-3 border-b border-slate-205 pb-2 font-bold select-none">
        <Sparkles className="w-4 h-4 text-gold-600 animate-pulse" /> Operations Snapshot
      </span>
      <div className="grid grid-cols-3 gap-2.5">
        {/* Total Events */}
        <div className="bg-white border border-slate-200/60 rounded-md p-2.5 text-center">
          <span className="text-[18px] font-extrabold text-slate-900 font-mono leading-none block">
            {events.length}
          </span>
          <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mt-1 block">
            Total Events
          </span>
        </div>
        {/* Staff Count */}
        <div className="bg-white border border-slate-200/60 rounded-md p-2.5 text-center">
          <span className="text-[18px] font-extrabold text-slate-900 font-mono leading-none block">
            {staff.length}
          </span>
          <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mt-1 block">
            Active Staff
          </span>
        </div>
        {/* Conflicts */}
        <div
          className={`border rounded-md p-2.5 text-center ${
            selectedDayConflicts.length > 0
              ? 'bg-red-50/60 border-red-200/60'
              : 'bg-white border-slate-200/60'
          }`}
        >
          <span
            className={`text-[18px] font-extrabold font-mono leading-none block ${
              selectedDayConflicts.length > 0 ? 'text-red-700' : 'text-slate-400'
            }`}
          >
            {selectedDayConflicts.length}
          </span>
          <span
            className={`text-[7px] uppercase tracking-widest font-bold mt-1 block ${
              selectedDayConflicts.length > 0 ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            Conflicts
          </span>
        </div>
        {/* Confirmed */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-md p-2.5 text-center">
          <span className="text-[18px] font-extrabold text-emerald-700 font-mono leading-none block">
            {confirmedCount}
          </span>
          <span className="text-[7px] text-emerald-600 uppercase tracking-widest font-bold mt-1 block">
            Confirmed
          </span>
        </div>
        {/* Pending */}
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-md p-2.5 text-center">
          <span className="text-[18px] font-extrabold text-amber-700 font-mono leading-none block">
            {pendingCount}
          </span>
          <span className="text-[7px] text-amber-600 uppercase tracking-widest font-bold mt-1 block">
            Pending
          </span>
        </div>
        {/* Canceled */}
        <div className="bg-red-50/60 border border-red-200/60 rounded-md p-2.5 text-center">
          <span className="text-[18px] font-extrabold text-red-700 font-mono leading-none block">
            {canceledCount}
          </span>
          <span className="text-[7px] text-red-600 uppercase tracking-widest font-bold mt-1 block">
            Canceled
          </span>
        </div>
      </div>
      {/* Upcoming Events (next 7 days) */}
      <div className="mt-2.5 bg-gold-50/40 border border-gold-200/40 rounded-md p-2.5 flex items-center justify-between">
        <div>
          <span className="text-[9px] text-gold-700 font-extrabold uppercase tracking-wider">
            Next 7 Days
          </span>
          <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">
            Upcoming confirmed &amp; pending
          </span>
        </div>
        <span className="text-[20px] font-extrabold text-gold-600 font-mono">{upcomingCount}</span>
      </div>
    </div>
  );
};

export default OperationsSnapshot;
