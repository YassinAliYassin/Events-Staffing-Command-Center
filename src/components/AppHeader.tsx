/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, LogOut, Undo2, Redo2 } from 'lucide-react';

interface AppHeaderProps {
  systime: string;
  sessionTimeLeft: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  undoStack: any[];
  redoStack: any[];
  undo: () => void;
  redo: () => void;
  triggerLogout: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  systime,
  sessionTimeLeft,
  mobileMenuOpen,
  setMobileMenuOpen,
  undoStack,
  redoStack,
  undo,
  redo,
  triggerLogout,
}) => {
  return (
    <header className="border-b border-gold-200/40 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-gold-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse"></div>
            <span className="font-display tracking-[0.25em] font-bold text-slate-900 text-base md:text-lg">FRESH PEOPLE</span>
          </div>
          <span className="hidden md:inline h-4 w-[1px] bg-slate-200"></span>
          <span className="hidden md:inline font-mono text-[9px] text-gold-700 uppercase tracking-widest bg-gold-50 px-2.5 py-0.5 border border-gold-200/40 rounded">
            Operational Command Hub
          </span>
        </div>

        <div className="flex items-center space-x-6">
          {/* System clock & Session status */}
          <div className="hidden sm:flex flex-col items-end font-mono text-right select-none">
            <span className="text-xs text-slate-800 tracking-widest font-bold">{systime} UTC</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-medium">Operator: yassin</span>
              <span className="h-2 w-[1px] bg-slate-200"></span>
              <span className="text-[8px] text-gold-600 font-black uppercase tracking-widest animate-pulse">Session: {sessionTimeLeft}</span>
            </div>
          </div>

          {/* Undo / Redo Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            {undoStack.length > 0 && (
              <span className="text-[7px] font-mono text-slate-400 ml-0.5" title={`${undoStack.length} steps in history`}>
                {undoStack.length}
              </span>
            )}
          </div>

          {/* Lock Trigger */}
          <button
            onClick={triggerLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded text-[9px] uppercase tracking-widest transition-all cursor-pointer font-mono font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
