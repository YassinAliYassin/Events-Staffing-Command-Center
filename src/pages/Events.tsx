import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Trash2, CheckCircle, Clock, MessageSquare,
  Zap, Users, MapPin, Star, AlertTriangle, Info
} from 'lucide-react';
import * as dataStore from '../services/dataStore';
import { onSnapshot, collection, query, orderBy, limit, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseService';

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time Firestore subscription
  useEffect(() => {
    if (!db) {
      // Fallback to local data
      setEvents(dataStore.listEvents());
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'events'), orderBy('date', 'desc'), limit(100));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.data().id,
        ...doc.data()
      }));
      setEvents(fetched);
      setLoading(false);
    }, (err) => {
      console.error('Events subscription error:', err);
      setEvents(dataStore.listEvents());
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch { /* ignore network */ }
    // Always persist locally
    const numId = Number(id);
    if (!Number.isNaN(numId)) dataStore.deleteEvent(numId);
    setEvents(prev => prev.filter(e => String(e.id) !== String(id)));
  };

  // Mobile-responsive styles
  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: 'clamp(12px, 3vw, 24px)',
      gap: 'clamp(16px, 3vw, 24px)'
    },
    title: {
      fontSize: 'clamp(24px, 4vw, 28px)',
      fontWeight: '600',
      color: '#e6edf3',
      letterSpacing: '-0.02em',
      margin: 0
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 'clamp(12px, 2.5vw, 20px)',
      width: '100%'
    },
    card: {
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 'clamp(8px, 2vw, 12px)',
      padding: 'clamp(16px, 3vw, 24px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(8px, 2vw, 12px)'
    },
    cardTitle: {
      fontSize: 'clamp(16px, 2.5vw, 18px)',
      fontWeight: '500',
      margin: 0
    },
    badge: {
      padding: 'clamp(4px, 1.5vw, 6px) clamp(8px, 2.5vw, 12px)',
      borderRadius: '999px',
      fontSize: 'clamp(10px, 2vw, 12px)'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#8b949e', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Loading events...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={styles.title}>Events Calendar</h1>
          <p style={{ color: '#8b949e', fontSize: 'clamp(12px, 2.5vw, 14px)', marginTop: 'clamp(4px, 1vw, 8px)' }}>
            {events.length} events scheduled
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        {events.length === 0 ? (
          <p style={{ color: '#8b949e', gridColumn: '1 / -1', textAlign: 'center', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
            No events scheduled
          </p>
        ) : (
          events.map(event => (
            <div key={event.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ ...styles.cardTitle, color: '#e6edf3' }}>
                  {event.title || 'Untitled Event'}
                </h3>
                <span style={{
                  ...styles.badge,
                  textTransform: 'uppercase',
                  backgroundColor: event.color ? `${event.color}20` : 'rgba(0, 229, 160, 0.1)',
                  color: event.color || '#00e5a0',
                  border: `1px solid ${event.color || '#00e5a0'}40`
                }}>
                  {event.date}
                </span>
              </div>

              {event.venue && (
                <p style={{ color: '#8b949e', fontSize: 'clamp(13px, 2.5vw, 14px)', margin: `clamp(4px, 1vw, 8px) 0` }}>
                  {event.venue}
                </p>
              )}

              {(event.staffIds?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)', color: '#8b949e', fontSize: 'clamp(12px, 2.5vw, 13px)' }}>
                  <Users size={14} />
                  {event.staffIds.length} staff assigned
                </div>
              )}

              <button
                onClick={() => handleDelete(event.id)}
                style={{
                  marginTop: 'auto',
                  padding: 'clamp(8px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  backgroundColor: 'transparent',
                  border: '1px solid #EF4444',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  color: '#EF4444',
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                <Trash2 size={14} style={{ display: 'inline', marginRight: 'clamp(4px, 1vw, 6px)' }} />
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;