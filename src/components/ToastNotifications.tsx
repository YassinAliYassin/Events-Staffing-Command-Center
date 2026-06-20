/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ToastAlert {
  message: string;
  type: 'error' | 'warn' | 'success' | 'info';
}

interface ToastNotificationsProps {
  toastAlert: ToastAlert | null;
  setToastAlert: (v: ToastAlert | null) => void;
  undoToast: string | null;
  syncStatusMsg: string | null;
}

const ToastNotifications: React.FC<ToastNotificationsProps> = ({
  toastAlert,
  setToastAlert,
  undoToast,
  syncStatusMsg,
}) => {
  return (
    <>
      {/* Premium Toast Overlay Notifications */}
      {toastAlert && (
        <div
          onClick={() => setToastAlert(null)}
          className={`fixed top-5 right-5 z-55 p-4 rounded-lg border shadow-xl max-w-sm max-h-[80vh] overflow-y-auto transition-all duration-300 backdrop-blur-md cursor-pointer flex items-start gap-3 select-none animate-fade-in ${
            toastAlert.type === 'error'
              ? 'bg-red-50/95 border-red-200 text-red-800'
              : toastAlert.type === 'warn'
              ? 'bg-amber-50/95 border-amber-200 text-amber-800'
              : toastAlert.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-250 text-emerald-805'
              : 'bg-gold-50/95 border-gold-200 text-gold-900'
          }`}
          style={{ zIndex: 9999 }}
        >
          <div className="flex-1">
            <h4 className="text-[10px] font-extrabold font-display uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              {toastAlert.type === 'error' && '🚨 System Alert'}
              {toastAlert.type === 'warn' && '⚠️ Attention'}
              {toastAlert.type === 'success' && '✓ Operation Complete'}
              {toastAlert.type === 'info' && 'ℹ Communication Update'}
            </h4>
            <p className="text-[9px] font-mono font-semibold leading-relaxed whitespace-pre-line">
              {toastAlert.message}
            </p>
          </div>
          <button type="button" className="text-xs font-extrabold select-none opacity-40 hover:opacity-100 p-0.5 leading-none">&times;</button>
        </div>
      )}

      {/* Undo/Redo Toast */}
      {undoToast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-lg border border-slate-300/60 bg-slate-800/95 backdrop-blur-md text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-2xl flex items-center gap-2 animate-fade-in"
        >
          <span className="text-amber-400">↩</span>
          {undoToast}
          <span className="text-slate-400 ml-1">| Ctrl+Z</span>
        </div>
      )}

      {/* Synchronizing indicator ticker */}
      {syncStatusMsg && (
        <div className="bg-gold-500 text-black text-[10px] font-mono py-1 px-4 text-center tracking-widest uppercase transition-all flex items-center justify-center gap-2 font-medium z-50 sticky top-0">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>{syncStatusMsg}</span>
        </div>
      )}
    </>
  );
};

export default ToastNotifications;
