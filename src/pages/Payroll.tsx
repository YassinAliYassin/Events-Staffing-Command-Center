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

interface PayrollProps {
  staff?: any[];
  events?: any[];
  records?: any[];
  addToast?: (msg: any, type?: string) => void;
}

const Payroll: React.FC<PayrollProps> = () => {
  const [payroll, setPayroll] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute payroll from localStorage immediately (local-first, works offline /
  // without Firebase). Firestore, when available, is a best-effort live refresh —
  // a failed/misconfigured Firestore must NOT block the local data.
  useEffect(() => {
    // Local-first: always render from the local store right away.
    fetchPayroll();

    if (!db) return;

    let unsubStaff: (() => void) | undefined;
    let unsubEvents: (() => void) | undefined;
    try {
      unsubStaff = onSnapshot(
        collection(db, 'staff'),
        () => fetchPayroll(),
        () => { /* Firestore unavailable (e.g. placeholder creds) — ignore, local data stands */ }
      );
      unsubEvents = onSnapshot(
        collection(db, 'events'),
        () => fetchPayroll(),
        () => { /* same: ignore, local data stands */ }
      );
    } catch {
      // Synchronous setup failure (misconfigured db) — local data already rendered.
    }

    return () => {
      unsubStaff?.();
      unsubEvents?.();
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

  // Mobile-responsive styles
  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '1000px',
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
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 'clamp(12px, 2.5vw, 16px)',
      width: '100%'
    },
    statCard: {
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 'clamp(8px, 2vw, 12px)',
      padding: 'clamp(16px, 3vw, 24px)',
      textAlign: 'center'
    },
    statValue: {
      fontSize: 'clamp(18px, 3vw, 24px)',
      fontWeight: '600',
      color: '#e6edf3'
    },
    table: {
      width: '100%',
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 'clamp(8px, 2vw, 12px)',
      overflow: 'hidden'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      padding: 'clamp(12px, 2.5vw, 16px) clamp(16px, 3vw, 24px)',
      backgroundColor: '#0d1117',
      borderBottom: '1px solid #30363d',
      fontWeight: '500',
      fontSize: 'clamp(10px, 2vw, 13px)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#8b949e'
    },
    filterRow: {
      display: 'flex',
      gap: 'clamp(8px, 2vw, 12px)',
      marginBottom: 'clamp(12px, 2.5vw, 16px)',
      width: '100%',
      flexWrap: 'wrap'
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 12px) clamp(8px, 2vw, 10px) clamp(36px, 5vw, 36px)',
      backgroundColor: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: 'clamp(6px, 1.5vw, 8px)',
      color: '#e6edf3',
      fontSize: 'clamp(14px, 2.5vw, 16px)',
      outline: 'none'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#8b949e', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Loading payroll...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={styles.title}>Payroll Summary</h1>
          <p style={{ color: '#8b949e', fontSize: 'clamp(12px, 2.5vw, 14px)', marginTop: 'clamp(4px, 1vw, 8px)' }}>
            {payroll?.cycleStart} to {payroll?.cycleEnd}
          </p>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#10B981' }}>
            {formatCurrency(payroll?.summary.totalEarnings || 0)}
          </div>
          <div style={{ color: '#8b949e', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: 'clamp(4px, 1vw, 8px)' }}>
            Total Earnings
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{payroll?.summary.totalHours.toFixed(1)} hrs</div>
          <div style={{ color: '#8b949e', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: 'clamp(4px, 1vw, 8px)' }}>
            Total Hours
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#F59E0B' }}>
            {formatCurrency(payroll?.summary.pendingAmount || 0)}
          </div>
          <div style={{ color: '#8b949e', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: 'clamp(4px, 1vw, 8px)' }}>
            Pending Payments
          </div>
        </div>
      </div>

      <div style={styles.filterRow}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: 'clamp(10px, 2vw, 12px)', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff..."
            style={styles.searchInput}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{
            padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            color: '#e6edf3',
            fontSize: 'clamp(13px, 2.5vw, 16px)',
            outline: 'none',
            cursor: 'pointer',
            minHeight: '44px'
          }}
        >
          <option value="ALL">All Status</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div style={styles.table} className="scroll-x">
        <div style={styles.tableHeader as React.CSSProperties}>
          <span>Name</span>
          <span>Hours</span>
          <span>Earnings</span>
          <span>Status</span>
        </div>
        {filteredStaff.length === 0 ? (
          <p style={{ color: '#8b949e', textAlign: 'center', padding: 'clamp(24px, 5vw, 48px)', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
            No staff match your filters
          </p>
        ) : (
          filteredStaff.map(staff => (
            <div key={staff.staffId} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: 'clamp(12px, 2.5vw, 16px) clamp(16px, 3vw, 24px)',
              borderBottom: '1px solid #30363d',
              fontSize: 'clamp(13px, 2.5vw, 14px)'
            }}>
              <div>
                <div style={{ color: '#e6edf3', fontWeight: '500' }}>{staff.fullName}</div>
                <div style={{ color: '#8b949e', fontSize: 'clamp(11px, 2vw, 12px)' }}>{staff.role}</div>
              </div>
              <div style={{ color: '#e6edf3', alignSelf: 'center' }}>
                {staff.totalHours.toFixed(1)} hrs
              </div>
              <div style={{ color: '#e6edf3', alignSelf: 'center' }}>
                {formatCurrency(staff.totalEarned)}
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{
                  padding: 'clamp(4px, 1.5vw, 6px) clamp(8px, 2.5vw, 12px)',
                  borderRadius: '999px',
                  fontSize: 'clamp(10px, 2vw, 12px)',
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