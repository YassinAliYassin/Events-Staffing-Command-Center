/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock, User, Briefcase } from 'lucide-react';

interface AuthGatewayProps {
  operatorId: string;
  setOperatorId: (v: string) => void;
  securityPhrase: string;
  setSecurityPhrase: (v: string) => void;
  authError: boolean;
  isForgotPasswordMode: boolean;
  setIsForgotPasswordMode: (v: boolean) => void;
  forgotOperatorId: string;
  setForgotOperatorId: (v: string) => void;
  forgotEmail: string;
  setForgotEmail: (v: string) => void;
  resetSuccessMessage: string | null;
  setResetSuccessMessage: (v: string | null) => void;
  handleAuthSubmit: (e: React.FormEvent) => void;
  handleResetPasswordRequest: (e: React.FormEvent) => void;
}

const AuthGateway: React.FC<AuthGatewayProps> = ({
  operatorId,
  setOperatorId,
  securityPhrase,
  setSecurityPhrase,
  authError,
  isForgotPasswordMode,
  setIsForgotPasswordMode,
  forgotOperatorId,
  setForgotOperatorId,
  forgotEmail,
  setForgotEmail,
  resetSuccessMessage,
  handleAuthSubmit,
  handleResetPasswordRequest,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all duration-700">
      <div className="w-full max-w-sm p-8 glass-panel rounded-lg shadow-2xl relative overflow-hidden bg-white/95 border border-gold-300/40 fade-in-up">
        {/* Decorative glowing header segment */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-50 border border-gold-300/30 mb-5 shadow-gold-glow">
            <span className="font-display text-lg tracking-[0.2em] text-gold-600 font-bold translate-x-0.5">FP</span>
          </div>
          <h1 className="font-display text-xl tracking-[0.25em] text-slate-900 font-bold uppercase text-center">FRESH PEOPLE</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1.5 text-center font-medium">Elite Staffing gateway</p>
        </div>

        {isForgotPasswordMode ? (
          <form onSubmit={handleResetPasswordRequest} id="pword_reset_form" className="space-y-5">
            <span className="text-[9px] uppercase tracking-widest text-gold-600 font-bold block border-b border-slate-100 pb-2 text-center">
              Secure Password Recovery Protocol
            </span>

            {resetSuccessMessage ? (
              <div className="text-[10px] text-emerald-800 border border-emerald-200 bg-emerald-50 px-3 py-2.5 rounded text-left leading-relaxed">
                {resetSuccessMessage}
              </div>
            ) : (
              <p className="text-[9px] text-slate-500 leading-relaxed text-center font-medium">
                Enter your Operator credentials and security recovery email below. An encrypted access bypass key will be dispatched.
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="recovery_operator_id" className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold block">Operator ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  id="recovery_operator_id"
                  value={forgotOperatorId}
                  onChange={(e) => setForgotOperatorId(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded focus:border-gold-500 focus:bg-white focus:outline-hidden transition-all font-mono placeholder-slate-400 font-medium"
                  placeholder="e.g. yassin"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="recovery_email" className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold block">Recovery Registry Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Briefcase className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  id="recovery_email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded focus:border-gold-500 focus:bg-white focus:outline-hidden transition-all font-mono placeholder-slate-400 font-medium"
                  placeholder="e.g. realyassinali@gmail.com"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2 pt-2">
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:brightness-110 active:scale-[0.99] transition-all text-white font-display font-semibold text-[10px] tracking-[0.2em] uppercase rounded shadow-sm cursor-pointer"
              >
                Dispatch Recovery Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordMode(false);
                }}
                className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all font-mono text-[9px] uppercase tracking-widest rounded cursor-pointer font-medium"
              >
                Return to Gateway Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} id="pword_login_form" className="space-y-5">
            {authError && (
              <div className="text-[10px] text-red-800 border border-red-200 bg-red-50 px-3 py-2.5 rounded text-center leading-relaxed font-medium">
                Verification credentials rejected.<br />Please re-enter correct security key phrases.
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="gate_operator" className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold block">Operator ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  id="gate_operator"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded focus:border-gold-500 focus:bg-white focus:outline-hidden transition-all font-mono placeholder-slate-400 font-medium"
                  placeholder="e.g. yassin"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="gate_phrase" className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold block">Security Phrase</label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(true)}
                  className="text-[8px] text-gold-600 hover:underline hover:text-gold-700 tracking-wider uppercase font-mono cursor-pointer font-bold"
                >
                  Forgot phrase?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  id="gate_phrase"
                  value={securityPhrase}
                  onChange={(e) => setSecurityPhrase(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded focus:border-gold-500 focus:bg-white focus:outline-hidden transition-all font-mono placeholder-slate-400 font-medium"
                  placeholder="•••••••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-5 bg-gradient-to-r from-gold-600 to-gold-500 hover:brightness-110 active:scale-[0.99] transition-all text-white font-display font-semibold text-[10px] tracking-[0.2em] uppercase rounded shadow-md cursor-pointer"
            >
              Verify Command Access
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-slate-100 pt-4">
          <p className="text-[8px] text-slate-500 tracking-widest leading-relaxed uppercase font-medium">
            FRESH PEOPLE OPERATIONAL SYSTEM V.26<br />
            Encryption bound active. Logs streamed to secure database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthGateway;
