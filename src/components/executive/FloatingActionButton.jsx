import React, { useState } from 'react';

/**
 * Floating Action Button Component
 * Premium FAB with expandable menu for quick actions
 */
const FloatingActionButton = ({ onNewEvent, onNewStaff, onNewClient }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: '📅', label: 'New Event', action: onNewEvent, color: 'var(--gold-500)' },
    { icon: '👤', label: 'Add Staff', action: onNewStaff, color: 'var(--priority-medium)' },
    { icon: '🏢', label: 'Add Client', action: onNewClient, color: 'var(--priority-low)' },
    { icon: '📋', label: 'Quick Task', action: () => console.log('Quick Task'), color: 'var(--priority-info)' }
  ];

  return (
    <div className="fab-container">
      {/* FAB Menu */}
      <div className={`fab-menu ${isOpen ? 'open' : ''}`}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="fab-item"
            onClick={() => {
              item.action && item.action();
              setIsOpen(false);
            }}
            title={item.label}
            style={{
              transitionDelay: isOpen ? `${index * 0.05}s` : '0s'
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        className="fab-main"
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Actions"
      >
        {isOpen ? '✕' : '⚡'}
      </button>
    </div>
  );
};

export default FloatingActionButton;
