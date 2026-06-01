import React from 'react';

/**
 * Executive KPI Cards Component
 * Premium animated KPI cards with glassmorphism and gold accents
 */
const KpiCards = ({ events = [], staff = [] }) => {
  // Calculate KPIs from data
  const totalEvents = events.length;
  const totalStaff = staff.length;
  const upcomingEvents = events.filter(e => new Date(e.start) > new Date()).length;
  const criticalEvents = events.filter(e => e.priority === 'critical').length;

  const kpis = [
    {
      id: 1,
      label: 'Total Events',
      value: totalEvents,
      icon: '📅',
      color: 'gold',
      trend: 'up',
      trendValue: '+12%'
    },
    {
      id: 2,
      label: 'Active Staff',
      value: totalStaff,
      icon: '👥',
      color: 'blue',
      trend: 'up',
      trendValue: '+3'
    },
    {
      id: 3,
      label: 'Upcoming',
      value: upcomingEvents,
      icon: '⏰',
      color: 'green',
      trend: 'up',
      trendValue: '+5'
    },
    {
      id: 4,
      label: 'Critical Alerts',
      value: criticalEvents,
      icon: '🚨',
      color: 'purple',
      trend: criticalEvents > 0 ? 'down' : 'up',
      trendValue: criticalEvents > 0 ? 'Needs Attention' : 'All Clear'
    }
  ];

  return (
    <div className="kpi-grid animate-fade-in">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.id}
          className="kpi-card"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={`kpi-card-icon ${kpi.color}`}>
            {kpi.icon}
          </div>
          <div className="kpi-card-value">{kpi.value}</div>
          <div className="kpi-card-label">{kpi.label}</div>
          <div className={`kpi-card-trend ${kpi.trend}`}>
            <span className="kpi-card-trend-icon">
              {kpi.trend === 'up' ? '↑' : '↓'}
            </span>
            <span>{kpi.trendValue}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
