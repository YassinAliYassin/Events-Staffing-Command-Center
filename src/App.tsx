import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Calendar, Users, UserCog, Combine, LayoutDashboard, Menu } from 'lucide-react';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import CalendarView from './components/CalendarView';
import StaffView from './components/StaffView';
import HomePage from './components/HomePage';
import UnifiedCalendarView from './components/Calendar/UnifiedView';
import Dashboard from './components/Dashboard';

// Import Apple Calendar events for unified calendar route
import appleCalendarEvents from './data/apple-calendar-events.json';

// Import Executive Command Center Components
import CommandBar from './components/executive/CommandBar';
import OperationsSidebar from './components/executive/OperationsSidebar';
import KpiCards from './components/executive/KpiCards';
import PremiumCalendar from './components/executive/PremiumCalendar';
import FloatingActionButton from './components/executive/FloatingActionButton';
import PremiumEventCard from './components/executive/PremiumEventCard';

// Import Executive Theme CSS
import './executive-theme.css';

// Main App Component with Executive Command Center
function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [events, setEvents] = useState([]);
  const [staff, setStaff] = useState([]);

  // Theme toggle handler
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('fpcc-theme', newTheme ? 'dark' : 'light');
  };

  // Load theme from localStorage on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('fpcc-theme') || 'dark';
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, staffRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/staff')
        ]);
        
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        }
        
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaff(staffData);
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    
    fetchData();
  }, [refreshKey]);

  return (
    <BrowserRouter>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Executive Command Bar */}
        <CommandBar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleTheme={handleThemeToggle}
          isDarkMode={isDarkMode}
        />

        {/* Main Layout with Sidebar */}
        <div style={{
          display: 'flex',
          flex: 1,
          position: 'relative'
        }}>
          {/* Operations Sidebar */}
          <OperationsSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            marginLeft: sidebarOpen ? '280px' : '0',
            transition: 'margin-left var(--transition-normal)',
            minHeight: 'calc(100vh - 80px)'
          }}
          className="main-content"
          >
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              {/* Ambient Glow Effects */}
              <div className="ambient-glow ambient-glow-1" />
              <div className="ambient-glow ambient-glow-2" />
              <div className="ambient-glow ambient-glow-3" />

              {/* Page Content */}
              <Routes>
                {/* Dashboard Route with KPI Cards */}
                <Route
                  path="/"
                  element={
                    <div className="animate-fade-in">
                      <div style={{
                        marginBottom: '2rem'
                      }}>
                        <h1 style={{
                          fontSize: '2rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, var(--gold-300), var(--gold-500))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          marginBottom: '0.5rem'
                        }}>
                          Executive Dashboard
                        </h1>
                        <p style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.875rem'
                        }}>
                          Welcome to Fresh People Command Center
                        </p>
                      </div>
                      
                      {/* KPI Cards */}
                      <KpiCards events={events} staff={staff} />
                      
                      {/* Dashboard Content */}
                      <Dashboard />
                    </div>
                  }
                />

                {/* Events Route */}
                <Route
                  path="/events"
                  element={
                    <div className="animate-fade-in">
                      <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--gold-300), var(--gold-500))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '2rem'
                      }}>
                        Event Management
                      </h1>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                          <EventForm onEventCreated={() => {
                            setRefreshKey(k => k + 1);
                          }} />
                        </div>
                        <div className="lg:col-span-2">
                          <EventList key={refreshKey} />
                        </div>
                      </div>
                    </div>
                  }
                />

                {/* Premium Calendar Route */}
                <Route
                  path="/calendar"
                  element={
                    <div className="animate-fade-in">
                      <PremiumCalendar />
                    </div>
                  }
                />

                {/* Unified Calendar Route */}
                <Route
                  path="/unified-calendar"
                  element={
                    <div className="animate-fade-in">
                      <div className="premium-calendar-container" style={{ marginTop: '2rem' }}>
                        <h2 style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, var(--gold-300), var(--gold-500))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          marginBottom: '1.5rem'
                        }}>
                          Unified Calendar View (iCloud + Local)
                        </h2>
                        <UnifiedCalendarView appleEvents={appleCalendarEvents} />
                      </div>
                    </div>
                  }
                />

                {/* Staff Route */}
                <Route
                  path="/staff"
                  element={
                    <div className="animate-fade-in">
                      <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--gold-300), var(--gold-500))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '2rem'
                      }}>
                        Staff Management
                      </h1>
                      <StaffView />
                    </div>
                  }
                />

                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          onNewEvent={() => console.log('New Event')}
          onNewStaff={() => console.log('New Staff')}
          onNewClient={() => console.log('New Client')}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
