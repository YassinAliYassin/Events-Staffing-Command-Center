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
    // UI optimistic update - events will sync via dataStore
    setEvents(events.filter(e => e.id !== id));
  };

  // Quiet Luxury styles
  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      gap: '24px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '600',
      color: '#e6edf3',
      letterSpacing: '-0.02em',
      margin: 0
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      width: '100%'
    },
    card: {
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#8b949e' }}>Loading events...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={styles.title}>Events Calendar</h1>
          <p style={{ color: '#8b949e', fontSize: '14px', marginTop: '8px' }}>
            {events.length} events scheduled
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        {events.length === 0 ? (
          <p style={{ color: '#8b949e', gridColumn: '1 / -1', textAlign: 'center' }}>
            No events scheduled
          </p>
        ) : (
          events.map(event => (
            <div key={event.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ color: '#e6edf3', fontSize: '18px', fontWeight: '500', margin: 0 }}>
                  {event.title || 'Untitled Event'}
                </h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  backgroundColor: event.color ? `${event.color}20` : 'rgba(0, 229, 160, 0.1)',
                  color: event.color || '#00e5a0',
                  border: `1px solid ${event.color || '#00e5a0'}40`
                }}>
                  {event.date}
                </span>
              </div>

              {event.venue && (
                <p style={{ color: '#8b949e', fontSize: '14px', margin: '8px 0' }}>
                  {event.venue}
                </p>
              )}

              {(event.staffIds?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '13px' }}>
                  <Users size={14} />
                  {event.staffIds.length} staff assigned
                </div>
              )}

              <button
                onClick={() => handleDelete(event.id)}
                style={{
                  marginTop: 'auto',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #EF4444',
                  borderRadius: '6px',
                  color: '#EF4444',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
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