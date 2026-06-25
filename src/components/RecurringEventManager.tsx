/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Repeat,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Link2,
  AlertTriangle,
  X,
  Calendar,
  Copy,
} from 'lucide-react';
import type { Event, Client, Venue, Staff } from '../types';

interface RecurringEventManagerProps {
  events: Event[];
  clients: Client[];
  venues: Venue[];
  staff: Staff[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  onDetachInstance: (eventId: string) => void;
  onDeleteSeries: (originalEventId: string) => void;
  onEditSeries: (parentEvent: Event) => void;
  onRegenerateSeries: (parentEvent: Event) => void;
}

interface SeriesGroup {
  parentEvent: Event;
  instances: Event[];
  totalCount: number;
}

const RecurringEventManager: React.FC<RecurringEventManagerProps> = ({
  events,
  clients,
  venues,
  staff,
  onEditEvent,
  onDeleteEvent,
  onDetachInstance,
  onDeleteSeries,
  onEditSeries,
  onRegenerateSeries,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [confirmDeleteSeries, setConfirmDeleteSeries] = useState<string | null>(null);
  const [confirmDetach, setConfirmDetach] = useState<string | null>(null);

  // Group recurring events by their parent (originalEventId)
  const seriesGroups = useMemo<SeriesGroup[]>(() => {
    const parents = events.filter(
      (e) => e.recurrence && e.recurrence !== 'none'
    );
    return parents
      .map((parent) => {
        const instances = events.filter(
          (e) => e.originalEventId === parent.id && e.isRecurrenceInstance
        );
        return {
          parentEvent: parent,
          instances: instances.sort((a, b) => a.date.localeCompare(b.date)),
          totalCount: instances.length + 1, // +1 for parent
        };
      })
      .sort(
        (a, b) =>
          new Date(b.parentEvent.date).getTime() -
          new Date(a.parentEvent.date).getTime()
      );
  }, [events]);

  // Also find orphaned instances (parent deleted but instances remain)
  const orphanedInstances = useMemo(() => {
    return events.filter(
      (e) =>
        e.isRecurrenceInstance &&
        e.originalEventId &&
        !events.find((p) => p.id === e.originalEventId)
    );
  }, [events]);

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || 'Unknown';
  const getVenueName = (venueId: string) =>
    venues.find((v) => v.id === venueId)?.name || 'Unknown';
  const getStaffCount = (event: Event) => event.staffIds?.length || 0;

  if (seriesGroups.length === 0 && orphanedInstances.length === 0) {
    return null; // Don't render if no recurring events exist
  }

  const totalRecurringEvents = seriesGroups.reduce(
    (sum, g) => sum + g.totalCount,
    0
  ) + orphanedInstances.length;

  return (
    <div className="mb-4">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Repeat className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wider">
            Recurring Events Manager
          </span>
          <span className="text-[8px] font-mono bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">
            {seriesGroups.length} series / {totalRecurringEvents} events
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mt-2 border border-violet-200 rounded-lg bg-white overflow-hidden">
          {/* Series List */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
            {seriesGroups.map((group) => {
              const isSeriesExpanded = expandedSeries === group.parentEvent.id;
              const parent = group.parentEvent;
              return (
                <div key={parent.id} className="bg-white">
                  {/* Parent Event Row */}
                  <div className="px-3 py-2.5 hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[8px] font-mono bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                          🔁 {parent.recurrence}
                        </span>
                        <div className="truncate">
                          <span className="text-[10px] font-bold text-slate-800 truncate">
                            {parent.title}
                          </span>
                          <span className="text-[8px] text-slate-500 ml-1.5">
                            {getClientName(parent.clientId)} @{' '}
                            {getVenueName(parent.venueId)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <span className="text-[8px] text-slate-400 font-mono">
                          {group.totalCount} events
                        </span>
                        <button
                          onClick={() =>
                            setExpandedSeries(
                              isSeriesExpanded ? null : parent.id
                            )
                          }
                          className="text-[8px] text-violet-600 hover:text-violet-800 font-bold cursor-pointer"
                          title="Show instances"
                        >
                          {isSeriesExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Parent Actions Row */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => onEditSeries(parent)}
                        className="flex items-center gap-1 text-[8px] text-gold-700 hover:text-gold-600 font-bold cursor-pointer"
                        title="Edit all instances in this series"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        Edit Series
                      </button>
                      <span className="text-slate-300 text-[8px]">|</span>
                      <button
                        onClick={() => onRegenerateSeries(parent)}
                        className="flex items-center gap-1 text-[8px] text-blue-600 hover:text-blue-500 font-bold cursor-pointer"
                        title="Regenerate all instances from parent"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        Regenerate
                      </button>
                      <span className="text-slate-300 text-[8px]">|</span>
                      <button
                        onClick={() => setConfirmDeleteSeries(parent.id)}
                        className="flex items-center gap-1 text-[8px] text-red-600 hover:text-red-500 font-bold cursor-pointer"
                        title="Delete entire series"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Delete Series
                      </button>
                    </div>

                    {/* Delete Series Confirmation */}
                    {confirmDeleteSeries === parent.id && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-[8px] text-red-700 font-bold">
                            Delete all {group.totalCount} events in this series?
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onDeleteSeries(parent.id);
                              setConfirmDeleteSeries(null);
                              setExpandedSeries(null);
                            }}
                            className="text-[8px] px-2 py-0.5 bg-red-600 text-white rounded font-bold cursor-pointer hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteSeries(null)}
                            className="text-[8px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold cursor-pointer hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Instances List (expanded) */}
                  {isSeriesExpanded && (
                    <div className="bg-slate-50/30 pl-4 pb-2">
                      {group.instances.length === 0 ? (
                        <div className="px-3 py-2 text-[8px] text-slate-400 italic">
                          No instances remaining (all deleted or detached)
                        </div>
                      ) : (
                        <div className="space-y-1 py-1.5">
                          {group.instances.map((inst) => (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between px-2 py-1.5 bg-white border border-slate-100 rounded text-[8px]"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Calendar className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                <span className="font-mono text-slate-600 font-bold">
                                  {inst.date}
                                </span>
                                <span className="text-slate-400">
                                  {inst.startTime}–{inst.endTime}
                                </span>
                                <span
                                  className={`px-1 py-0.5 rounded font-bold border ${
                                    inst.status === 'Confirmed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : inst.status === 'Canceled'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {inst.status}
                                </span>
                                <span className="text-slate-400">
                                  ({getStaffCount(inst)} staff)
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => onEditEvent(inst)}
                                  className="text-gold-700 hover:text-gold-600 cursor-pointer"
                                  title="Edit this instance"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmDetach(inst.id)}
                                  className="text-blue-600 hover:text-blue-500 cursor-pointer"
                                  title="Detach from series (make independent)"
                                >
                                  <Link2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteEvent(inst.id)}
                                  className="text-red-500 hover:text-red-400 cursor-pointer"
                                  title="Delete this instance"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Detach Confirmation */}
                      {confirmDetach && (
                        <div className="mt-1.5 mx-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Link2 className="w-3 h-3 text-blue-500" />
                            <span className="text-[8px] text-blue-700 font-bold">
                              Detach this instance from the series?
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                onDetachInstance(confirmDetach);
                                setConfirmDetach(null);
                              }}
                              className="text-[8px] px-2 py-0.5 bg-blue-600 text-white rounded font-bold cursor-pointer hover:bg-blue-700"
                            >
                              Detach
                            </button>
                            <button
                              onClick={() => setConfirmDetach(null)}
                              className="text-[8px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold cursor-pointer hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Orphaned Instances */}
            {orphanedInstances.length > 0 && (
              <div className="px-3 py-2 bg-amber-50/50 border-t border-amber-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-[8px] font-bold text-amber-700 uppercase tracking-wider">
                    Orphaned Instances (parent deleted)
                  </span>
                  <span className="text-[8px] font-mono bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                    {orphanedInstances.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {orphanedInstances.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between px-2 py-1.5 bg-white border border-amber-100 rounded text-[8px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 font-bold">
                          {inst.date}
                        </span>
                        <span className="text-slate-700 font-medium">
                          {inst.title}
                        </span>
                        <span className="text-slate-400">
                          ({getClientName(inst.clientId)})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditEvent(inst)}
                          className="text-gold-700 hover:text-gold-600 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(inst.id)}
                          className="text-red-500 hover:text-red-400 cursor-pointer"
                          title="Delete"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringEventManager;
