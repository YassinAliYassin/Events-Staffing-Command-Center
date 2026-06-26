import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { enUS } from 'date-fns/locale/en-US';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

/**
 * Premium Calendar Component
 * Luxury calendar with gold palette, animations, and priority colors
 * Preserves all existing functionality while adding premium UI
 */
const PremiumCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch from unified calendar endpoint (includes iCloud)
        const calRes = await fetch('/api/calendar?format=json');
        const calData = await calRes.json();
        
        const localEvents = (calData.local || []).map((event) => {
          const start = new Date(event.start);
          const end = new Date(event.end || start.getTime() + (event.duration || 4) * 60 * 60 * 1000);
          const staffList = Array.isArray(event.staff_assigned) 
            ? event.staff_assigned.join(', ') 
            : (event.staff_assigned || 'Unassigned');
          return {
            id: event.id,
            title: `${event.title} • ${staffList}`,
            start,
            end,
            resource: { ...event, source: 'local' },
            priority: event.priority || 'medium'
          };
        });
        
        const icloudEvents = (calData.icloud || []).map((event) => {
          const start = new Date(event.start);
          const end = new Date(event.end || start.getTime() + 4 * 60 * 60 * 1000);
          return {
            id: event.id || `icloud-${Math.random()}`,
            title: `☁️ ${event.title}`,
            start,
            end,
            resource: { ...event, source: 'icloud' },
            priority: 'info'
          };
        });
        
        setEvents([...localEvents, ...icloudEvents]);
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Event styling based on priority
  const eventPropGetter = (event) => {
    const priority = event.resource?.priority || 'medium';
    const source = event.resource?.source;
    
    let className = '';
    let style = {};
    
    // Priority-based styling
    switch (priority) {
      case 'critical':
        className = 'priority-critical';
        style = {
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
        };
        break;
      case 'high':
        className = 'priority-high';
        style = {
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
        };
        break;
      case 'medium':
        className = 'priority-medium';
        style = {
          background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
        };
        break;
      case 'low':
        className = 'priority-low';
        style = {
          background: 'linear-gradient(135deg, #10B981, #059669)',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
        };
        break;
      case 'info':
      default:
        className = source === 'icloud' ? 'icloud' : 'priority-info';
        style = {
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
        };
        break;
    }
    
    return {
      className,
      style: {
        ...style,
        borderRadius: '6px',
        border: 'none',
        padding: '4px 8px',
        fontSize: '0.813rem',
        fontWeight: 500,
        transition: 'all 0.15s ease',
        cursor: 'pointer'
      }
    };
  };

  // Custom toolbar component
  const CustomToolbar = (toolbarProps) => {
    const { onNavigate, onView, label } = toolbarProps;
    
    return (
      <div className="calendar-header">
        <div className="calendar-title">{label}</div>
        <div className="calendar-nav">
          <button
            className="calendar-nav-btn"
            onClick={() => onNavigate('PREV')}
            title="Previous"
          >
            ‹
          </button>
          <button
            className="calendar-today-btn"
            onClick={() => {
              onNavigate('TODAY');
              setDate(new Date());
            }}
          >
            Today
          </button>
          <button
            className="calendar-nav-btn"
            onClick={() => onNavigate('NEXT')}
            title="Next"
          >
            ›
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="premium-calendar-container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          color: 'var(--text-muted)',
          fontSize: '1.125rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--gold-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Loading Executive Calendar...</span>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="premium-calendar-container animate-fade-in">
      {/* Ambient Glow Effects */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
        eventPropGetter={eventPropGetter}
        components={{
          toolbar: CustomToolbar
        }}
        popup
        showMultiDayTimes
        step={60}
        timeslots={1}
        onSelectEvent={(event) => {
          console.log('Event selected:', event);
          // TODO: Open event detail modal
        }}
        onSelectSlot={(slotInfo) => {
          console.log('Slot selected:', slotInfo);
          // TODO: Open new event modal
        }}
        selectable
      />
    </div>
  );
};

export default PremiumCalendar;
