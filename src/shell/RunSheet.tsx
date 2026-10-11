import FillBar from './FillBar';
import { isCheckedIn, runSheetText } from './ops';

interface RunSheetProps {
  events: any[];
  staff: any[];
  clients: any[];
  onClose: () => void;
  onCheckIn: (eventId: number, staffId: number) => void;
}

export default function RunSheet({ events, staff, clients, onClose, onCheckIn }: RunSheetProps) {
  const sheets = (events || []).filter(Boolean);
  return (
    <div className="escc-run-overlay" role="dialog" aria-modal="true" aria-labelledby="run-sheet-title">
      <div className="print-doc escc-run-sheet">
        <div className="escc-run-head">
          <div>
            <div className="escc-kicker">Fresh People · Events staffing</div>
            <h2 id="run-sheet-title">{sheets.length === 1 ? 'Run sheet' : 'Run sheets'}</h2>
          </div>
          <div className="no-print escc-run-actions">
            <button type="button" className="escc-btn escc-btn-primary" onClick={() => window.print()}>Print</button>
            <button type="button" className="escc-btn" onClick={onClose}>Close</button>
          </div>
        </div>
        {sheets.map((event) => {
          const client = clients.find((c) => c.id === event.clientId);
          const crew = (event.staffIds || []).map((id: number) => staff.find((s) => s.id === id)).filter(Boolean);
          return (
            <section key={event.id} className="escc-run-event">
              <h3>{event.title}</h3>
              <p className="escc-muted">{event.date} · {event.startTime || '—'}–{event.endTime || '—'} · {event.venue || 'Venue TBC'}</p>
              {client && <p>Client: {client.name}{client.phone ? ` · ${client.phone}` : ''}</p>}
              <FillBar event={event} />
              <table className="escc-run-table">
                <thead>
                  <tr>
                    <th>Crew</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Here</th>
                  </tr>
                </thead>
                <tbody>
                  {crew.length === 0 && (
                    <tr>
                      <td colSpan={4}>No crew assigned yet.</td>
                    </tr>
                  )}
                  {crew.map((member: any) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.role || member.department || '—'}</td>
                      <td>{member.phone || '—'}</td>
                      <td>
                        {isCheckedIn(event, member.id) ? 'Checked in' : '—'}
                        <button type="button" className="escc-btn no-print escc-btn-tiny" onClick={() => onCheckIn(event.id, member.id)}>
                          {isCheckedIn(event, member.id) ? 'Undo' : 'Check in'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="escc-notes"><strong>Notes.</strong> {event.notes || 'None on file.'}</p>
              <pre className="no-print escc-run-plain">{runSheetText(event, staff, client)}</pre>
            </section>
          );
        })}
      </div>
    </div>
  );
}
