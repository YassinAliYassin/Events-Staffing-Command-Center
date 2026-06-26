import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Trash2, Pencil } from 'lucide-react';
import * as dataStore from '../services/dataStore';

const StaffView = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: '',
    rate: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch staff list from data store (now connected to Firestore)
  const fetchStaff = useCallback(() => {
    const stored = dataStore.listStaff();
    setStaffList(stored || []);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (editingId) {
        // Optimistic update for edit - sync to Firestore
        dataStore.updateStaff(editingId, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          rate: Number(formData.rate) || 0,
          notes: formData.notes
        });
        setSuccessMsg('Staff updated!');
      } else {
        // Optimistic update for add - sync to Firestore
        dataStore.addStaff({
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          rate: Number(formData.rate) || 0,
          notes: formData.notes
        });
        setSuccessMsg('Staff added!');
      }
      
      setFormData({ name: '', phone: '', role: '', rate: '', notes: '' });
      setEditingId(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staff: any) => {
    setFormData({
      name: staff.name,
      phone: staff.phone || '',
      role: staff.role || '',
      rate: staff.rate?.toString() || '',
      notes: staff.notes || ''
    });
    setEditingId(staff.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this staff member?')) return;
    
    // Optimistic delete
    setStaffList(staffList.filter(s => s.id !== id));
    fetchStaff();
  };

  // Mobile-responsive Quiet Luxury styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: 'clamp(12px, 3vw, 24px)',
      gap: 'clamp(16px, 3vw, 24px)'
    },
    card: {
      width: '100%',
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 'clamp(8px, 2vw, 12px)',
      padding: 'clamp(16px, 3vw, 32px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(16px, 2.5vw, 20px)'
    },
    title: {
      fontSize: 'clamp(18px, 3vw, 24px)',
      fontWeight: '600',
      color: '#e6edf3',
      letterSpacing: '-0.02em',
      margin: 0
    },
    formRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: 'clamp(10px, 2vw, 13px)',
      fontWeight: '500',
      color: '#8b949e',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    },
    input: {
      width: '100%',
      padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
      backgroundColor: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: 'clamp(6px, 1.5vw, 8px)',
      color: '#e6edf3',
      fontSize: 'clamp(14px, 2.5vw, 16px)',
      outline: 'none'
    },
    button: {
      padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 3vw, 24px)',
      border: 'none',
      borderRadius: 'clamp(6px, 1.5vw, 8px)',
      fontSize: 'clamp(13px, 2.5vw, 14px)',
      fontWeight: '500',
      cursor: 'pointer',
      minHeight: '44px'
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'clamp(12px, 2.5vw, 16px)',
      backgroundColor: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: 'clamp(6px, 1.5vw, 8px)'
    }
  };

  return (
    <div style={styles.container as React.CSSProperties}>
      <div style={styles.card as React.CSSProperties}>
        <h2 style={styles.title as React.CSSProperties}>
          {editingId ? 'Edit Staff' : 'Add New Staff'}
        </h2>

        {successMsg && (
          <div style={{
            padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10B981',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            color: '#10B981',
            fontSize: 'clamp(12px, 2.5vw, 14px)'
          }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{
            padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #EF4444',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            color: '#EF4444',
            fontSize: 'clamp(12px, 2.5vw, 14px)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 20px)' }}>
          <div style={styles.formRow as React.CSSProperties}>
            <label style={styles.label as React.CSSProperties}>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              required
              style={styles.input as React.CSSProperties}
              placeholder="e.g. John Smith"
            />
          </div>

          {/* Mobile stack on small screens */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(12px, 2.5vw, 16px)' }} className="mobile-stack">
            <div style={styles.formRow as React.CSSProperties}>
              <label style={styles.label as React.CSSProperties}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                style={styles.input as React.CSSProperties}
                placeholder="+27 123 456 789"
              />
            </div>
            <div style={styles.formRow as React.CSSProperties}>
              <label style={styles.label as React.CSSProperties}>Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={e => handleChange('role', e.target.value)}
                style={styles.input as React.CSSProperties}
                placeholder="e.g. Sound Engineer"
              />
            </div>
          </div>

          <div style={styles.formRow as React.CSSProperties}>
            <label style={styles.label as React.CSSProperties}>Hourly Rate (R)</label>
            <input
              type="number"
              value={formData.rate}
              onChange={e => handleChange('rate', e.target.value)}
              min="0"
              step="0.01"
              style={styles.input as React.CSSProperties}
              placeholder="e.g. 150"
            />
          </div>

          <div style={styles.formRow as React.CSSProperties}>
            <label style={styles.label as React.CSSProperties}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={3}
              style={{...styles.input as React.CSSProperties, resize: 'vertical'}}
              placeholder="Any additional notes..."
            />
          </div>

          <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', flexDirection: 'column' }} className="mobile-full-width">
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button as React.CSSProperties,
                flex: 1,
                backgroundColor: '#00e5a0',
                color: '#0d1117',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Saving...' : editingId ? 'Update Staff' : 'Add Staff'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: '', phone: '', role: '', rate: '', notes: '' });
                  setEditingId(null);
                }}
                style={{
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 3vw, 24px)',
                  backgroundColor: 'transparent',
                  border: '1px solid #30363d',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  color: '#e6edf3',
                  cursor: 'pointer',
                  minHeight: '44px',
                  width: '100%'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={styles.card as React.CSSProperties}>
        <h3 style={{...styles.title as React.CSSProperties, fontSize: 'clamp(16px, 2.5vw, 20px)'}}>
          Staff List ({staffList.length})
        </h3>

        {staffList.length === 0 ? (
          <p style={{ color: '#8b949e', textAlign: 'center', padding: 'clamp(16px, 3vw, 32px) 0', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
            No staff added yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 12px)' }}>
            {staffList.map(staff => (
              <div key={staff.id} style={styles.listItem as React.CSSProperties}>
                <div>
                  <p style={{ color: '#e6edf3', fontWeight: '500', margin: 0, fontSize: 'clamp(13px, 2.5vw, 14px)' }}>
                    {staff.name}
                  </p>
                  <p style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: '#8b949e', margin: 'clamp(4px, 1vw, 6px) 0 0' }}>
                    {staff.role || 'No role'} • {staff.phone || 'No phone'}
                    {staff.rate ? ` • R${staff.rate}/hr` : ''}
                  </p>
                  {staff.notes && (
                    <p style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#8b949e', margin: 'clamp(6px, 1.5vw, 8px) 0 0' }}>
                      {staff.notes}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 8px)' }}>
                  <button
                    onClick={() => handleEdit(staff)}
                    style={{
                      padding: 'clamp(6px, 1.5vw, 8px)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#8b949e',
                      cursor: 'pointer',
                      minHeight: '44px',
                      minWidth: '44px'
                    }}
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(staff.id)}
                    style={{
                      padding: 'clamp(6px, 1.5vw, 8px)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      minHeight: '44px',
                      minWidth: '44px'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffView;