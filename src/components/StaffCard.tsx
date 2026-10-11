import React from 'react';

interface StaffCardProps {
  staff: any;
  active: boolean;
  hrs: number;
  note?: string;
  warn?: boolean;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

const StaffCard: React.FC<StaffCardProps> = ({ staff, active, hrs, note, warn, onView, onEdit, onRemove }) => {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${warn ? 'var(--amber)' : active ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: 'var(--text)' }}>{staff.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{staff.role ? `${staff.role} · ` : ''}{staff.department}</div>
          {note && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{note}</div>}
        </div>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? '#bf8f3b' : 'transparent',
          border: `1px solid ${active ? '#bf8f3b' : '#2a323d'}`,
          boxShadow: active ? '0 0 8px #bf8f3b' : 'none',
          flexShrink: 0
        }} />
      </div>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent-2)' }}>
        R{staff.rate}/h · {hrs.toFixed(1)}h logged
      </div>
      {staff.uniform && (
        <div style={{ marginTop: 8 }}>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            background: 'var(--surface-2)',
            color: 'var(--muted)',
            border: '1px solid var(--border)'
          }}>Uni</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={onView} style={{
          flex: 1,
          minHeight: 44,
          fontSize: 13,
          padding: '8px 8px',
          cursor: 'pointer',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text)'
        }}>View</button>
        <button onClick={onEdit} aria-label={`Edit ${staff.name}`} style={{
          flex: 1,
          minHeight: 44,
          fontSize: 13,
          padding: '8px 8px',
          cursor: 'pointer',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text)'
        }}>Edit</button>
        <button onClick={onRemove} aria-label={`Remove ${staff.name}`} style={{
          flex: 1,
          minHeight: 44,
          fontSize: 13,
          padding: '8px 8px',
          cursor: 'pointer',
          background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)',
          borderRadius: 6,
          color: 'var(--danger)'
        }}>Remove</button>
      </div>
    </div>
  );
};

export default StaffCard;
