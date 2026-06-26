import React from 'react';

interface StaffCardProps {
  staff: any;
  active: boolean;
  hrs: number;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

const StaffCard: React.FC<StaffCardProps> = ({ staff, active, hrs, onView, onEdit, onRemove }) => {
  return (
    <div style={{
      background: '#161b22',
      border: `1px solid ${active ? '#00e5a044' : '#30363d'}`,
      borderRadius: 12,
      padding: '16px 18px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{staff.name}</div>
          <div style={{ fontSize: 12, color: '#7d8590' }}>{staff.department}</div>
        </div>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? '#00e5a0' : 'transparent',
          border: `1px solid ${active ? '#00e5a0' : '#30363d'}`,
          flexShrink: 0
        }} />
      </div>
      <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
        R{staff.rate}/h · {hrs.toFixed(1)}h
      </div>
      {staff.uniform && (
        <div style={{ marginTop: 8 }}>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            background: '#7d859022',
            color: '#7d8590',
            border: '1px solid #7d859044'
          }}>Uni</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={onView} style={{
          flex: 1,
          fontSize: 11,
          padding: '4px 8px',
          cursor: 'pointer',
          background: '#1c2330',
          border: '1px solid #30363d',
          borderRadius: 6,
          color: '#e6edf3'
        }}>View</button>
        <button onClick={onEdit} style={{
          flex: 1,
          fontSize: 11,
          padding: '4px 8px',
          cursor: 'pointer',
          background: '#1c2330',
          border: '1px solid #30363d',
          borderRadius: 6,
          color: '#e6edf3'
        }}>E</button>
        <button onClick={onRemove} style={{
          flex: 1,
          fontSize: 11,
          padding: '4px 8px',
          cursor: 'pointer',
          background: '#f8514922',
          border: '1px solid #f8514944',
          borderRadius: 6,
          color: '#f85149'
        }}>X</button>
      </div>
    </div>
  );
};

export default StaffCard;
