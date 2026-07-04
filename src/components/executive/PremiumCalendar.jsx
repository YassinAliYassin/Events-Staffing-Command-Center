import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [draftEvent, setDraftEvent] = useState(null);

  const selectedEventDetails = useMemo(() => {
    if (!selectedEvent) return null;
    const staffList = Array.isArray(selectedEvent.resource?.staff_assigned)
      ? selectedEvent.resource.staff_assigned.join(', ')
      : (selectedEvent.resource?.staff_assigned || 'Unassigned');

    return {
      title: selectedEvent.title,
      start: selectedEvent.start,
      end: selectedEvent.end,
      source: selectedEvent.resource?.source || 'local',
      location: selectedEvent.resource?.venue || selectedEvent.resource?.location || 'No venue specified',
      staffList,
      notes: selectedEvent.resource?.notes || 'No notes available.',
      priority: selectedEvent.priority || 'medium',
    };
  }, [selectedEvent]);

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

  const openNewEventModal = (slotInfo) => {
    const start = new Date(slotInfo.start || date);
    const end = new Date(slotInfo.end || new Date(start.getTime() + 4 * 60 * 60 * 1000));
    setDraftEvent({
      title: '',
      start,
      end,
      venue: '',
      notes: '',
      staff: '',
      priority: 'medium',
    });
  };

  const saveDraftEvent = () => {
    if (!draftEvent?.title.trim()) return;

    const newEvent = {
      id: `local-${Date.now()}`,
      title: draftEvent.title.trim(),
      start: draftEvent.start,
      end: draftEvent.end,
      resource: {
        source: 'local',
        venue: draftEvent.venue.trim(),
        notes: draftEvent.notes.trim(),
        staff_assigned: draftEvent.staff
          ? draftEvent.staff.split(',').map(part => part.trim()).filter(Boolean)
          : [],
        priority: draftEvent.priority,
      },
      priority: draftEvent.priority,
    };

    setEvents(prev => [newEvent, ...prev]);
    setDraftEvent(null);
    setSelectedEvent(newEvent);
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
            <span>Loading ESCC Calendar...</span>
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
          setSelectedEvent(event);
          setDraftEvent(null);
        }}
        onSelectSlot={(slotInfo) => {
          openNewEventModal(slotInfo);
          setSelectedEvent(null);
        }}
        selectable
      />

      {selectedEventDetails && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '100%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Event Details</h2>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Title</div>
                <div style={{ fontWeight: 600 }}>{selectedEventDetails.title}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>When</div>
                <div>{format(selectedEventDetails.start, 'EEE, d MMM yyyy HH:mm')} - {format(selectedEventDetails.end, 'HH:mm')}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Source</div>
                <div>{selectedEventDetails.source === 'icloud' ? 'iCloud Calendar' : 'Local Calendar'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Venue</div>
                <div>{selectedEventDetails.location}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Staff</div>
                <div>{selectedEventDetails.staffList}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Notes</div>
                <div>{selectedEventDetails.notes}</div>
              </div>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {draftEvent && (
        <div className="modal-overlay" onClick={() => setDraftEvent(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create Event</h2>
              <button className="modal-close" onClick={() => setDraftEvent(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '12px' }}>
              <label>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Title</div>
                <input
                  value={draftEvent.title}
                  onChange={(e) => setDraftEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                  style={{ width: '100%' }}
                />
              </label>
              <label>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Venue</div>
                <input
                  value={draftEvent.venue}
                  onChange={(e) => setDraftEvent(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Venue location"
                  style={{ width: '100%' }}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Start</div>
                  <input
                    type="datetime-local"
                    value={format(draftEvent.start, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setDraftEvent(prev => ({ ...prev, start: new Date(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>End</div>
                  <input
                    type="datetime-local"
                    value={format(draftEvent.end, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setDraftEvent(prev => ({ ...prev, end: new Date(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              <label>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Staff Assigned</div>
                <input
                  value={draftEvent.staff}
                  onChange={(e) => setDraftEvent(prev => ({ ...prev, staff: e.target.value }))}
                  placeholder="Comma-separated staff names"
                  style={{ width: '100%' }}
                />
              </label>
              <label>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 4 }}>Notes</div>
                <textarea
                  value={draftEvent.notes}
                  onChange={(e) => setDraftEvent(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="modal-close-btn" onClick={() => setDraftEvent(null)}>Cancel</button>
              <button
                className="modal-save-btn"
                onClick={saveDraftEvent}
                disabled={!draftEvent.title.trim()}
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumCalendar;
