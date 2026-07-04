import React, { useState } from 'react';

/**
 * ESCC Command Bar Component
 * Premium executive command bar with quick actions
 */
const CommandBar = ({ onToggleSidebar, onToggleTheme, isDarkMode = true }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const quickActions = [
    { icon: '➕', label: 'New Event', action: () => console.log('New Event') },
    { icon: '👤', label: 'Add Staff', action: () => console.log('Add Staff') },
    { icon: '📊', label: 'Reports', action: () => console.log('Reports') },
    { icon: '⚙️', label: 'Settings', action: () => console.log('Settings') }
  ];

  return (
    <header className="executive-header">
      <div className="executive-header-inner">
        {/* Logo Section */}
        <div className="executive-logo">
          <div className="executive-logo-icon">ESCC</div>
          <div className="executive-logo-text">
            <div className="executive-logo-title">FRESH PEOPLE</div>
            <div className="executive-logo-subtitle">Executive Command Center</div>
          </div>
        </div>

        {/* Command Bar Actions */}
        <div className="command-bar">
          {/* Search Toggle */}
          <button
            className="command-bar-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            title="Search"
          >
            <span className="command-bar-btn-icon">🔍</span>
            <span className="command-bar-btn-text">Search</span>
          </button>

          {/* Quick Actions */}
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="command-bar-btn"
              onClick={action.action}
              title={action.label}
            >
              <span className="command-bar-btn-icon">{action.icon}</span>
              <span className="command-bar-btn-text">{action.label}</span>
            </button>
          ))}

          {/* Sidebar Toggle */}
          <button
            className="command-bar-btn"
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
          >
            <span className="command-bar-btn-icon">☰</span>
          </button>

          {/* Theme Toggle */}
          <button
            className={`theme-toggle ${!isDarkMode ? 'active' : ''}`}
            onClick={onToggleTheme}
            title="Toggle Theme"
          >
            <div className="theme-toggle-thumb">
              {isDarkMode ? '🌙' : '☀️'}
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar (Expandable) */}
      {searchOpen && (
        <div className="search-bar-expanded" style={{
          padding: '1rem 2rem',
          borderTop: '1px solid var(--border)',
          animation: 'slideIn 0.3s ease'
        }}>
          <input
            type="text"
            placeholder="Search events, staff, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-sans)'
            }}
            autoFocus
          />
        </div>
      )}
    </header>
  );
};

export default CommandBar;
