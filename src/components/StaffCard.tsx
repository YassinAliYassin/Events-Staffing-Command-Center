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
      background: 'linear-gradient(160deg, rgba(20,25,32,0.9), rgba(26,33,43,0.7))',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${active ? '#bf8f3b55' : '#2a323d'}`,
      boxShadow: active ? '0 0 0 1px #bf8f3b22, 0 4px 20px rgba(191,143,59,0.12)' : '0 4px 16px rgba(0,0,0,0.25)',
      borderRadius: 12,
      padding: '16px 18px',
      transition: 'transform 0.15s, border-color 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{staff.name}</div>
          <div style={{ fontSize: 12, color: '#828d9c' }}>{staff.department}</div>
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
      <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#e0b968' }}>
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
            background: '#828d9c22',
            color: '#828d9c',
            border: '1px solid #828d9c44'
          }}>Uni</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={onView} style={{
          flex: 1,
          fontSize: 11,
          padding: '4px 8px',
          cursor: 'pointer',
          background: '#1a212b',
          border: '1px solid #2a323d',
          borderRadius: 6,
          color: '#eef1f5'
        }}>View</button>
        <button onClick={onEdit} style={{
          flex: 1,
          fontSize: 11,
          padding: '4px 8px',
          cursor: 'pointer',
          background: '#1a212b',
          border: '1px solid #2a323d',
          borderRadius: 6,
          color: '#eef1f5'
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
