import { useMemo, useState } from 'react';
import StaffCard from '../components/StaffCard';
import FillBar from './FillBar';
import { assignmentConflicts, downloadCsv, isMarkedOff } from './ops';

interface RosterBoardProps {
  staff: any[];
  records: any[];
  events: any[];
  today: string;
  onView: (staff: any) => void;
  onEdit: (staff: any) => void;
  onRemove: (staff: any) => void;
  onToggleOff: (staff: any, date: string) => void;
  onRunSheet: (event: any) => void;
}

export default function RosterBoard({ staff, records, events, today, onView, onEdit, onRemove, onToggleOff, onRunSheet }: RosterBoardProps) {
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('all');
  const [status, setStatus] = useState('all');

  const departments = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((member) => { if (member.department) set.add(member.department); });
    return [...set].sort();
  }, [staff]);

  const upcoming = useMemo(
    () => [...events].filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date) || String(a.startTime).localeCompare(String(b.startTime))).slice(0, 6),
    [events, today]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((member) => {
      const active = records.some((record) => record.staffId === member.id && !record.clockOut);
      const off = isMarkedOff(member, today);
      const busy = events.some((event) => event.date === today && (event.staffIds || []).includes(member.id));
      if (dept !== 'all' && member.department !== dept) return false;
      if (status === 'clocked' && !active) return false;
      if (status === 'off' && !off) return false;
      if (status === 'free' && (off || busy || active)) return false;
      if (status === 'assigned' && !busy) return false;
      if (!q) return true;
      return [member.name, member.role, member.department, member.phone].join(' ').toLowerCase().includes(q);
    });
  }, [staff, records, events, query, dept, status, today]);

  function exportRoster() {
    downloadCsv(`roster-${today}.csv`, [
      ['Name', 'Role', 'Department', 'Rate', 'Phone', 'Email', 'Off today', 'Assigned today'],
      ...staff.map((member) => [
        member.name,
        member.role,
        member.department,
        member.rate,
        member.phone,
        member.email,
        isMarkedOff(member, today) ? 'yes' : 'no',
        events.some((event) => event.date === today && (event.staffIds || []).includes(member.id)) ? 'yes' : 'no',
      ]),
    ]);
  }

  return (
    <div className="escc-roster">
      <div className="escc-toolbar">
        <label className="escc-field">
          <span>Search roster</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, role, phone" />
        </label>
        <label className="escc-field">
          <span>Department</span>
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">All departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="escc-field">
          <span>Today</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Everyone</option>
            <option value="free">Free today</option>
            <option value="assigned">Assigned today</option>
            <option value="clocked">Clocked in</option>
            <option value="off">Marked off</option>
          </select>
        </label>
        <button type="button" className="escc-btn" onClick={exportRoster}>Export CSV</button>
      </div>

      <section className="escc-panel" aria-labelledby="fill-heading">
        <h2 id="fill-heading">Upcoming fill</h2>
        {upcoming.length === 0 ? (
          <p className="escc-muted">No upcoming events. Fill rate appears here once an event has a crew target.</p>
        ) : (
          <ul className="escc-fill-list">
            {upcoming.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <div className="escc-muted">{event.date} · {event.startTime || '—'} · {event.venue || 'Venue TBC'}</div>
                  <FillBar event={event} />
                </div>
                <button type="button" className="escc-btn escc-btn-tiny" onClick={() => onRunSheet(event)}>Run sheet</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {staff.length === 0 ? (
        <div className="escc-state" role="status">
          <strong>Roster is empty.</strong>
          <p>Add staff from the Add Staff tab. Nothing here is invented — the list is your saved roster.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="escc-state" role="status">
          <strong>No one matches that filter.</strong>
          <p>Clear search or choose Everyone.</p>
        </div>
      ) : (
        <div className="escc-card-grid">
          {rows.map((member) => {
            const active = records.some((record) => record.staffId === member.id && !record.clockOut);
            const shifts = records.filter((record) => record.staffId === member.id && record.clockOut);
            const hrs = shifts.reduce((sum, record) => sum + (record.clockOut - record.clockIn) / 3600000, 0);
            const todayEvents = events.filter((event) => event.date === today && (event.staffIds || []).includes(member.id));
            const clashes = events.filter((event) => assignmentConflicts(member.id, event, events).length > 0 && (event.staffIds || []).includes(member.id));
            const off = isMarkedOff(member, today);
            const next = [...events].filter((event) => event.date >= today && (event.staffIds || []).includes(member.id)).sort((a, b) => a.date.localeCompare(b.date))[0];
            const note = off
              ? 'Marked off today'
              : todayEvents.length
                ? `Today: ${todayEvents.map((event) => event.title).join(', ')}`
                : next
                  ? `Next: ${next.title} · ${next.date}`
                  : 'No upcoming assignment';
            return (
              <div key={member.id} className="escc-roster-card">
                <StaffCard
                  staff={member}
                  active={active}
                  hrs={hrs}
                  note={note}
                  warn={off || clashes.length > 0}
                  onView={() => onView(member)}
                  onEdit={() => onEdit(member)}
                  onRemove={() => onRemove(member)}
                />
                <button type="button" className="escc-btn escc-btn-tiny" onClick={() => onToggleOff(member, today)}>
                  {off ? 'Clear day off' : 'Mark off today'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
