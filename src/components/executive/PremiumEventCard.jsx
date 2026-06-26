import React from 'react';

/**
 * Premium Event Card Component
 * Luxury event display with priority indicators and animations
 */
const PremiumEventCard = ({ event, onClick, onEdit, onDelete }) => {
  const getPriorityClass = (priority) => {
    const priorityMap = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return priorityMap[priority] || 'medium';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="event-card animate-fade-in" onClick={() => onClick && onClick(event)}>
      {/* Event Header */}
      <div className="event-card-header">
        <div style={{ flex: 1 }}>
          <div className="event-card-title">{event.title || 'Untitled Event'}</div>
          <div className="event-card-time">
            <span>📅</span>
            <span>{formatDate(event.start)}</span>
            <span>•</span>
            <span>{formatTime(event.start)}</span>
          </div>
        </div>
        {event.priority && (
          <span className={`event-card-priority ${getPriorityClass(event.priority)}`}>
            {event.priority.toUpperCase()}
          </span>
        )}
      </div>

      {/* Event Details */}
      {event.description && (
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          marginBottom: '1rem',
          lineHeight: 1.5
        }}>
          {event.description}
        </div>
      )}

      {/* Staff Assignment */}
      {event.staff_assigned && event.staff_assigned.length > 0 && (
        <div className="event-card-staff">
          <div style={{ display: 'flex', gap: '-8px' }}>
            {event.staff_assigned.slice(0, 3).map((staff, index) => (
              <div
                key={index}
                className="event-card-staff-avatar"
                style={{
                  marginLeft: index > 0 ? '-8px' : '0',
                  zIndex: 3 - index
                }}
              >
                {getInitials(staff)}
              </div>
            ))}
            {event.staff_assigned.length > 3 && (
              <div
                className="event-card-staff-avatar"
                style={{
                  marginLeft: '-8px',
                  background: 'var(--bg-tertiary)',
                  fontSize: '0.75rem'
                }}
              >
                +{event.staff_assigned.length - 3}
              </div>
            )}
          </div>
          <div className="event-card-staff-name">
            {event.staff_assigned.length === 1
              ? event.staff_assigned[0]
              : `${event.staff_assigned.length} staff assigned`}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        opacity: 0,
        transition: 'opacity var(--transition-fast)'
      }}
      className="event-card-actions"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(event);
          }}
          style={{
            padding: '0.375rem 0.75rem',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: '0.813rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--border-hover)';
            e.target.style.color = 'var(--text-gold)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.color = 'var(--text-secondary)';
          }}
        >
          ✏️ Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(event);
          }}
          style={{
            padding: '0.375rem 0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--priority-critical)',
            fontSize: '0.813rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          🗑️ Delete
        </button>
      </div>

      <style>{`
        .event-card:hover .event-card-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default PremiumEventCard;
