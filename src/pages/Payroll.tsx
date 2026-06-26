import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign, MessageCircle, Download, Calendar,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Clock, XCircle, Filter, RefreshCw, ChevronDown, ChevronUp,
  Search, Send, FileText, BarChart3, Users
} from 'lucide-react';
import * as dataStore from '../services/dataStore';
import { collection, onSnapshot, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseService';

interface PayrollStaff {
  staffId: number;
  fullName: string;
  phone: string;
  role: string;
  assignmentsCount: number;
  totalHours: number;
  totalEarned: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL' | 'PROCESSING' | 'OVERDUE';
  pendingAmount?: number;
  paidAmount?: number;
}

interface PayrollData {
  cycleStart: string;
  cycleEnd: string;
  staff: PayrollStaff[];
  summary: {
    totalStaff: number;
    totalHours: number;
    totalEarnings: number;
    paidAmount: number;
    pendingAmount: number;
    overdueCount: number;
  };
}

const Payroll: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time staff sync from Firestore
  useEffect(() => {
    if (!db) {
      // Fallback to local data
      fetchPayroll();
      return;
    }

    const unsubStaff = onSnapshot(collection(db, 'staff'), () => {
      fetchPayroll();
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), () => {
      fetchPayroll();
    });

    return () => {
      unsubStaff();
      unsubEvents();
    };
  }, []);

  const fetchPayroll = useCallback(() => {
    setLoading(true);
    
    const storedStaff: any[] = dataStore.listStaff();
    const storedEvents: any[] = dataStore.listEvents();
    const today = new Date();
    const cycleStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    const eventsInCycle = storedEvents.filter((ev: any) => ev.date >= cycleStart && ev.date <= cycleEnd);

    const eventHours = (ev: any) => {
      try {
        const [sh, sm] = ev.startTime?.split(':').map(Number) || [0, 0];
        const [eh, em] = ev.endTime?.split(':').map(Number) || [0, 0];
        return (eh * 60 + em - sh * 60 - sm) / 60;
      } catch {
        return 0;
      }
    };

    const staffWithEarnings = storedStaff.map((s: any) => {
      const assignments = eventsInCycle.filter((ev: any) => (ev.staffIds || []).includes(s.id));
      const totalHours = assignments.reduce((sum: number, ev: any) => sum + eventHours(ev), 0);
      const totalEarned = totalHours * (s.rate || 0);
      return {
        staffId: s.id,
        fullName: s.name,
        phone: s.phone || '',
        role: s.role || '',
        assignmentsCount: assignments.length,
        totalHours,
        totalEarned,
        paymentStatus: 'UNPAID' as 'PAID' | 'UNPAID' | 'PARTIAL' | 'PROCESSING' | 'OVERDUE',
        pendingAmount: totalEarned * 0.3,
        paidAmount: totalEarned * 0.7
      };
    });

    setPayroll({
      cycleStart,
      cycleEnd,
      staff: staffWithEarnings,
      summary: {
        totalStaff: staffWithEarnings.length,
        totalHours: staffWithEarnings.reduce((sum, s) => sum + s.totalHours, 0),
        totalEarnings: staffWithEarnings.reduce((sum, s) => sum + s.totalEarned, 0),
        paidAmount: staffWithEarnings.reduce((sum, s) => sum + (s.paidAmount || 0), 0),
        pendingAmount: staffWithEarnings.reduce((sum, s) => sum + (s.pendingAmount || 0), 0),
        overdueCount: 0
      }
    });

    setLoading(false);
  }, []);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    if (!payroll) return [];
    const q = searchQuery.toLowerCase().trim();
    return payroll.staff.filter(s => 
      (statusFilter === 'ALL' || s.paymentStatus === statusFilter) &&
      (q === '' || s.fullName.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
    );
  }, [payroll, statusFilter, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '1000px',
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
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      width: '100%'
    },
    statCard: {
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#e6edf3'
    },
    table: {
      width: '100%',
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      padding: '16px 24px',
      backgroundColor: '#0d1117',
      borderBottom: '1px solid #30363d',
      fontWeight: '500',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#8b949e'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#8b949e' }}>Loading payroll...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={styles.title}>Payroll Summary</h1>
          <p style={{ color: '#8b949e', fontSize: '14px', marginTop: '8px' }}>
            {payroll?.cycleStart} to {payroll?.cycleEnd}
          </p>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#10B981' }}>
            {formatCurrency(payroll?.summary.totalEarnings || 0)}
          </div>
          <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '8px' }}>
            Total Earnings
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{payroll?.summary.totalHours.toFixed(1)} hrs</div>
          <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '8px' }}>
            Total Hours
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#F59E0B' }}>
            {formatCurrency(payroll?.summary.pendingAmount || 0)}
          </div>
          <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '8px' }}>
            Pending Payments
          </div>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff..."
            style={{
              width: '100%',
              paddingLeft: '36px',
              padding: '10px 12px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#e6edf3',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#e6edf3',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Status</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div style={styles.table}>
        <div style={styles.tableHeader as React.CSSProperties}>
          <span>Name</span>
          <span>Hours</span>
          <span>Earnings</span>
          <span>Status</span>
        </div>
        {filteredStaff.length === 0 ? (
          <p style={{ color: '#8b949e', textAlign: 'center', padding: '48px' }}>
            No staff match your filters
          </p>
        ) : (
          filteredStaff.map(staff => (
            <div key={staff.staffId} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '16px 24px',
              borderBottom: '1px solid #30363d',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: '#e6edf3', fontWeight: '500' }}>{staff.fullName}</div>
                <div style={{ color: '#8b949e', fontSize: '12px' }}>{staff.role}</div>
              </div>
              <div style={{ color: '#e6edf3', alignSelf: 'center' }}>
                {staff.totalHours.toFixed(1)} hrs
              </div>
              <div style={{ color: '#e6edf3', alignSelf: 'center' }}>
                {formatCurrency(staff.totalEarned)}
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  {staff.paymentStatus}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Payroll;