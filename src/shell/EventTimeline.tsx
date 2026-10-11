import FillBar from './FillBar';

interface EventTimelineProps {
  events: any[];
  staff: any[];
  clients: any[];
  onOpen: (event: any) => void;
  onRunSheet: (event: any) => void;
  onCheckIn: (eventId: number, staffId: number) => void;
}

function checked(event: any, staffId: number) {
  return Array.isArray(event?.checkIns) && event.checkIns.some((c: any) => c.staffId === staffId);
}

export default function EventTimeline({ events, staff, clients, onOpen, onRunSheet, onCheckIn }: EventTimelineProps) {
  const sorted = [...(events || [])].sort((a, b) => `${a.date} ${a.startTime || ''}`.localeCompare(`${b.date} ${b.startTime || ''}`));
  const groups = new Map<string, any[]>();
  for (const event of sorted) {
    const key = event.date || 'Undated';
    const list = groups.get(key) || [];
    list.push(event);
    groups.set(key, list);
  }

  if (sorted.length === 0) {
    return (
      <div className="escc-state" role="status">
        <strong>No events on the timeline.</strong>
        <p>Create an event from the month view. This list uses the events already saved in the command center.</p>
      </div>
    );
  }

  return (
    <div className="escc-timeline">
      {[...groups.entries()].map(([date, dayEvents]) => (
        <section key={date} className="escc-timeline-day">
          <h3>{date}</h3>
          <ol>
            {dayEvents.map((event) => {
              const client = clients.find((c) => c.id === event.clientId);
              const crew = (event.staffIds || []).map((id: number) => staff.find((s) => s.id === id)).filter(Boolean);
              return (
                <li key={event.id}>
                  <div className="escc-timeline-time">{event.startTime || '—'}–{event.endTime || '—'}</div>
                  <div className="escc-timeline-card">
                    <div className="escc-timeline-title">
                      <button type="button" className="escc-link" onClick={() => onOpen(event)}>{event.title}</button>
                      <button type="button" className="escc-btn escc-btn-tiny" onClick={() => onRunSheet(event)}>Run sheet</button>
                    </div>
                    <p className="escc-muted">{event.venue || 'Venue TBC'}{client ? ` · ${client.name}` : ''}</p>
                    <FillBar event={event} />
                    <ul className="escc-crew">
                      {crew.length === 0 && <li>No crew assigned</li>}
                      {crew.map((member: any) => (
                        <li key={member.id}>
                          <span>{member.name}</span>
                          <button type="button" className="escc-btn escc-btn-tiny" onClick={() => onCheckIn(event.id, member.id)}>
                            {checked(event, member.id) ? 'Checked in' : 'Check in'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
