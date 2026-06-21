/**
 * StaffPerformancePanel Component
 * Dashboard widget showing staff performance metrics:
 * - Events handled count per staff
 * - Confirmation rate (Available RSVP %)
 * - Response reliability score
 * - Top performers leaderboard
 * - Role distribution of assignments
 */

import React, { useMemo, useState } from 'react';
import { Trophy, TrendingUp, Star, ChevronDown, ChevronUp, Award, UserCheck, BarChart3 } from 'lucide-react';
import type { Event, Staff, Client, Venue } from '../types';

export interface StaffPerformancePanelProps {
  staff: Staff[];
  events: Event[];
  clients: Client[];
  venues: Venue[];
}

interface StaffMetrics {
  staffId: string;
  name: string;
  role: string;
  totalEvents: number;
  confirmedEvents: number;
  canceledEvents: number;
  rsvpAvailable: number;
  rsvpTotal: number;
  confirmationRate: number; // percentage
  reliabilityScore: number; // weighted score
  upcomingEvents: number;
}

function computeMetrics(staff: Staff[], events: Event[]): StaffMetrics[] {
  const now = new Date().toISOString().split('T')[0];

  return staff.map((s) => {
    // Events assigned to this staff
    const assignedEvents = events.filter((e) => e.staffIds?.includes(s.id));
    const localAssigned = assignedEvents.filter((e) => !e.googleEventId && !e.appleEventId);

    const totalEvents = localAssigned.length;
    const confirmedEvents = localAssigned.filter((e) => e.status === 'Confirmed').length;
    const canceledEvents = localAssigned.filter((e) => e.status === 'Canceled').length;

    // RSVP stats
    let rsvpAvailable = 0;
    let rsvpTotal = 0;
    assignedEvents.forEach((e) => {
      if (e.staffRSVPs && e.staffRSVPs[s.id]) {
        rsvpTotal++;
        if (e.staffRSVPs[s.id] === 'Available') {
          rsvpAvailable++;
        }
      }
    });

    // Confirmation rate: % of assigned events that are confirmed
    const confirmationRate = totalEvents > 0 ? Math.round((confirmedEvents / totalEvents) * 100) : 0;

    // RSVP response rate
    const rsvpRate = rsvpTotal > 0 ? Math.round((rsvpAvailable / rsvpTotal) * 100) : 0;

    // Upcoming events
    const upcomingEvents = localAssigned.filter((e) => e.date >= now).length;

    // Reliability score: weighted combination
    // 40% confirmation rate + 30% RSVP rate + 30% volume factor (capped at 20 events)
    const volumeFactor = Math.min(totalEvents / 20, 1) * 100;
    const reliabilityScore = Math.round(
      confirmationRate * 0.4 + rsvpRate * 0.3 + volumeFactor * 0.3
    );

    return {
      staffId: s.id,
      name: `${s.name} ${s.surname}`.trim(),
      role: s.role,
      totalEvents,
      confirmedEvents,
      canceledEvents,
      rsvpAvailable,
      rsvpTotal,
      confirmationRate,
      reliabilityScore,
      upcomingEvents,
    };
  });
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/20 border-amber-500/30';
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

function getRankIcon(index: number) {
  if (index === 0) return <Trophy className="w-3.5 h-3.5 text-yellow-400" />;
  if (index === 1) return <Award className="w-3.5 h-3.5 text-slate-300" />;
  if (index === 2) return <Award className="w-3.5 h-3.5 text-amber-600" />;
  return <span className="text-[10px] text-slate-500 font-mono">#{index + 1}</span>;
}

export default function StaffPerformancePanel({
  staff,
  events,
  clients,
  venues,
}: StaffPerformancePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const metrics = useMemo(() => computeMetrics(staff, events), [staff, events]);

  // Sort by reliability score descending
  const sorted = useMemo(
    () => [...metrics].sort((a, b) => b.reliabilityScore - a.reliabilityScore),
    [metrics]
  );

  // Only show staff with at least 1 event
  const activeStaff = sorted.filter((m) => m.totalEvents > 0);
  const topPerformers = activeStaff.slice(0, 3);

  // Summary stats
  const totalConfirmed = metrics.reduce((sum, m) => sum + m.confirmedEvents, 0);
  const totalAssigned = metrics.reduce((sum, m) => sum + m.totalEvents, 0);
  const avgReliability = activeStaff.length > 0
    ? Math.round(activeStaff.reduce((sum, m) => sum + m.reliabilityScore, 0) / activeStaff.length)
    : 0;

  if (staff.length === 0) return null;

  return (
    <div className="glass-panel rounded-lg p-4 shadow-luxury-glow">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Staff Performance
          </span>
          <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">
            {activeStaff.length} active
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Summary bar */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="bg-slate-800/50 rounded-md px-2 py-1.5 text-center">
          <div className="text-[10px] text-slate-400">Confirmed</div>
          <div className="text-sm font-bold text-emerald-400">
            {totalAssigned > 0 ? Math.round((totalConfirmed / totalAssigned) * 100) : 0}%
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-md px-2 py-1.5 text-center">
          <div className="text-[10px] text-slate-400">Avg Score</div>
          <div className={`text-sm font-bold ${getScoreColor(avgReliability)}`}>
            {avgReliability}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-md px-2 py-1.5 text-center">
          <div className="text-[10px] text-slate-400">Events</div>
          <div className="text-sm font-bold text-blue-400">{totalAssigned}</div>
        </div>
      </div>

      {/* Top performers */}
      {topPerformers.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Top Performers</span>
          </div>
          <div className="space-y-1">
            {topPerformers.map((m, idx) => (
              <button
                key={m.staffId}
                onClick={() => setShowDetail(showDetail === m.staffId ? null : m.staffId)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all ${
                  showDetail === m.staffId
                    ? 'bg-slate-700/60 border-slate-500/40'
                    : 'bg-slate-800/30 border-transparent hover:bg-slate-700/40'
                }`}
              >
                <div className="w-4 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(idx)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[11px] text-slate-200 truncate">{m.name}</div>
                  <div className="text-[9px] text-slate-500">{m.role}</div>
                </div>
                <div className={`text-xs font-bold ${getScoreColor(m.reliabilityScore)}`}>
                  {m.reliabilityScore}
                </div>
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      m.reliabilityScore >= 80
                        ? 'bg-emerald-500'
                        : m.reliabilityScore >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${m.reliabilityScore}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded: full rankings */}
      {expanded && activeStaff.length > 3 && (
        <div className="mt-2 border-t border-slate-700/50 pt-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">
            All Staff Rankings
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {activeStaff.slice(3).map((m, idx) => (
              <button
                key={m.staffId}
                onClick={() => setShowDetail(showDetail === m.staffId ? null : m.staffId)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all ${
                  showDetail === m.staffId
                    ? 'bg-slate-700/60 border-slate-500/40'
                    : 'bg-slate-800/30 border-transparent hover:bg-slate-700/40'
                }`}
              >
                <div className="w-4 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(idx + 3)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[11px] text-slate-200 truncate">{m.name}</div>
                  <div className="text-[9px] text-slate-500">{m.totalEvents} events · {m.confirmationRate}%</div>
                </div>
                <div className={`text-xs font-bold ${getScoreColor(m.reliabilityScore)}`}>
                  {m.reliabilityScore}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail panel for selected staff */}
      {showDetail && (() => {
        const m = metrics.find((x) => x.staffId === showDetail);
        if (!m) return null;
        return (
          <div className="mt-2 border-t border-slate-700/50 pt-2 bg-slate-800/30 rounded-md p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold text-slate-200">{m.name}</div>
              <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreBg(m.reliabilityScore)} ${getScoreColor(m.reliabilityScore)}`}>
                Score: {m.reliabilityScore}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Events</span>
                <span className="text-slate-200 font-medium">{m.totalEvents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confirmed</span>
                <span className="text-emerald-400 font-medium">{m.confirmedEvents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confirmation</span>
                <span className="text-slate-200 font-medium">{m.confirmationRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RSVP Rate</span>
                <span className="text-slate-200 font-medium">
                  {m.rsvpTotal > 0 ? Math.round((m.rsvpAvailable / m.rsvpTotal) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Upcoming</span>
                <span className="text-blue-400 font-medium">{m.upcomingEvents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Canceled</span>
                <span className="text-red-400 font-medium">{m.canceledEvents}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Empty state */}
      {activeStaff.length === 0 && (
        <div className="mt-3 text-center py-3">
          <UserCheck className="w-5 h-5 text-slate-600 mx-auto mb-1" />
          <div className="text-[10px] text-slate-500">No performance data yet</div>
          <div className="text-[9px] text-slate-600">Assign staff to events to see metrics</div>
        </div>
      )}
    </div>
  );
}
