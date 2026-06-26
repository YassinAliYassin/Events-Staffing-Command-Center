import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Trash2, DollarSign, Calendar, User } from 'lucide-react';
import * as dataStore from '../services/dataStore';

interface QuoteFormProps {
  onQuoteCreated?: () => void;
  editingQuote?: any;
  onCancel?: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ onQuoteCreated, editingQuote, onCancel }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    eventId: '',
    validUntil: '',
    includeTax: true,
    taxRate: 15,
    items: [{ desc: '', qty: 1, rate: 0 }],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(() => {
    setClients(dataStore.listClients());
    setEvents(dataStore.listEvents());
  }, []);

  useEffect(() => {
    fetchData();
    if (editingQuote) {
      setFormData({
        clientId: editingQuote.clientId?.toString() || '',
        eventId: editingQuote.eventId?.toString() || '',
        validUntil: editingQuote.validUntil || '',
        includeTax: editingQuote.includeTax ?? true,
        taxRate: editingQuote.taxRate || 15,
        items: editingQuote.lines || [{ desc: '', qty: 1, rate: 0 }],
        notes: editingQuote.notes || ''
      });
    }
  }, [fetchData, editingQuote]);

  const subtotal = formData.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const tax = formData.includeTax ? subtotal * (formData.taxRate / 100) : 0;
  const total = subtotal + tax;

  const handleItemChange = (idx: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === idx ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { desc: '', qty: 1, rate: 0 }]
    }));
  };

  const removeItem = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const quote = {
        clientId: Number(formData.clientId),
        eventId: formData.eventId ? Number(formData.eventId) : undefined,
        validUntil: formData.validUntil,
        includeTax: formData.includeTax,
        taxRate: formData.taxRate,
        lines: formData.items.filter(item => item.desc.trim()),
        notes: formData.notes,
        status: 'draft'
      };

      dataStore.addQuote(quote);
      setSuccessMsg('Quote created!');
      setFormData({
        clientId: '',
        eventId: '',
        validUntil: '',
        includeTax: true,
        taxRate: 15,
        items: [{ desc: '', qty: 1, rate: 0 }],
        notes: ''
      });
      if (onQuoteCreated) onQuoteCreated();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      gap: '24px'
    },
    card: {
      width: '100%',
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '12px',
      padding: '32px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#e6edf3',
      letterSpacing: '-0.02em',
      margin: 0
    },
    label: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#8b949e',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: '6px',
      color: '#e6edf3',
      fontSize: '14px',
      outline: 'none'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {editingQuote ? 'Edit Quote' : 'Create Quote'}
        </h2>

        {successMsg && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10B981',
            borderRadius: '8px',
            color: '#10B981',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            color: '#EF4444',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={styles.label}>Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">Select client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={styles.label}>Valid Until</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={styles.label}>Event (Optional)</label>
            <select
              value={formData.eventId}
              onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
              style={styles.input}
            >
              <option value="">Link to event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={styles.label}>Line Items</label>
              <button
                type="button"
                onClick={addItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#00e5a0',
                  color: '#0d1117',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {formData.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <input
                  type="text"
                  value={item.desc}
                  onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                  placeholder="Description"
                  style={styles.input}
                />
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                  min="1"
                  style={styles.input}
                />
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                  min="0"
                  step="0.01"
                  placeholder="Rate"
                  style={styles.input}
                />
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid #30363d',
                      borderRadius: '6px',
                      color: '#EF4444',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={styles.label}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{
                ...styles.input,
                resize: 'vertical'
              }}
              placeholder="Additional notes..."
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px 0',
            borderTop: '1px solid #30363d',
            gap: '16px'
          }}>
            <span style={{ color: '#8b949e' }}>Subtotal: ${subtotal.toFixed(2)}</span>
            <span style={{ color: '#8b949e' }}>Tax: ${tax.toFixed(2)}</span>
            <span style={{ color: '#e6edf3', fontWeight: '600', fontSize: '18px' }}>Total: ${total.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: '#00e5a0',
                color: '#0d1117',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Saving...' : editingQuote ? 'Update Quote' : 'Create Quote'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  color: '#e6edf3',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;