/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface RegistrationModalsProps {
  activeModal: 'client' | 'venue' | 'staff' | null;
  setActiveModal: (modal: 'client' | 'venue' | 'staff' | null) => void;
  newClient: { name: string; contact: string; email: string; phone: string; notes: string };
  setNewClient: React.Dispatch<React.SetStateAction<{ name: string; contact: string; email: string; phone: string; notes: string }>>;
  newVenue: { name: string; address: string; capacity: number; tier: string; notes: string };
  setNewVenue: React.Dispatch<React.SetStateAction<{ name: string; address: string; capacity: number; tier: string; notes: string }>>;
  newStaff: { name: string; surname: string; role: string; rate: number; phone: string; email: string; notes: string };
  setNewStaff: React.Dispatch<React.SetStateAction<{ name: string; surname: string; role: string; rate: number; phone: string; email: string; notes: string }>>;
  registerClient: (e: React.FormEvent) => void;
  registerVenue: (e: React.FormEvent) => void;
  registerStaff: (e: React.FormEvent) => void;
}

export default function RegistrationModals({
  activeModal,
  setActiveModal,
  newClient,
  setNewClient,
  newVenue,
  setNewVenue,
  newStaff,
  setNewStaff,
  registerClient,
  registerVenue,
  registerStaff,
}: RegistrationModalsProps) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm p-6 bg-white border border-slate-300 shadow-3xl rounded-xl relative fade-in-up">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer select-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ingestion Sub-Form: Client */}
        {activeModal === 'client' && (
          <form onSubmit={registerClient} className="space-y-4">
            <span className="text-[10px] font-display text-gold-700 uppercase tracking-[0.15em] block mb-4 border-b border-slate-200 pb-2 font-bold">
              New Agency Client Ingest
            </span>
            <div className="space-y-1">
              <label htmlFor="reg_client_name" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Client / Sponsor Name</label>
              <input
                type="text"
                id="reg_client_name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                required
                placeholder="e.g. Christian Dior SA"
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-2 rounded focus:border-gold-500 focus:outline-hidden font-bold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="reg_client_contact" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Account Sponsor Contact</label>
              <input
                type="text"
                id="reg_client_contact"
                value={newClient.contact}
                onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })}
                required
                placeholder="e.g. Charlotte de Laprès"
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-2 rounded focus:border-gold-500 focus:outline-hidden font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg_client_email" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Secure Email</label>
                <input
                  type="email"
                  id="reg_client_email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  required
                  placeholder="comms@dior.corp"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2 rounded focus:border-gold-500 focus:outline-hidden font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="reg_client_phone" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Hotline Contact</label>
                <input
                  type="text"
                  id="reg_client_phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  required
                  placeholder="+33 6 4981 9283"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2 rounded focus:border-gold-500 focus:outline-hidden font-mono font-bold"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="reg_client_notes" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Compliance guidelines</label>
              <textarea
                id="reg_client_notes"
                value={newClient.notes}
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                rows={2}
                placeholder="General premium hospitality compliance requirements..."
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-1.5 rounded focus:border-gold-500 focus:outline-hidden font-bold"
              ></textarea>
            </div>
            <div className="flex space-x-3 pt-2 font-mono text-[9px] uppercase tracking-widest font-extrabold">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded cursor-pointer transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded cursor-pointer transition-all"
              >
                Commit
              </button>
            </div>
          </form>
        )}

        {/* Ingestion Sub-Form: Venue */}
        {activeModal === 'venue' && (
          <form onSubmit={registerVenue} className="space-y-4">
            <span className="text-[10px] font-display text-gold-700 uppercase tracking-[0.15em] block mb-4 border-b border-slate-200 pb-2 font-bold">
              New Venue Index Registration
            </span>
            <div className="space-y-1">
              <label htmlFor="reg_venue_name" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Venue Name</label>
              <input
                type="text"
                id="reg_venue_name"
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                required
                placeholder="e.g. Grand Palais Éphémère"
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-2 rounded focus:border-gold-500 focus:outline-hidden font-bold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="reg_venue_address" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Physical Address</label>
              <input
                type="text"
                id="reg_venue_address"
                value={newVenue.address}
                onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                required
                placeholder="e.g. Place Joffre, 75007 Paris"
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-2 rounded focus:border-gold-500 focus:outline-hidden font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg_venue_capacity" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Capacity Limits</label>
                <input
                  type="number"
                  id="reg_venue_capacity"
                  value={newVenue.capacity}
                  onChange={(e) => setNewVenue({ ...newVenue, capacity: parseInt(e.target.value) || 100 })}
                  required
                  placeholder="500"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2 rounded focus:border-gold-500 focus:outline-hidden font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="reg_venue_tier" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Premium Grade</label>
                <select
                  id="reg_venue_tier"
                  value={newVenue.tier}
                  onChange={(e) => setNewVenue({ ...newVenue, tier: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2.5 py-2.5 rounded focus:border-gold-500 focus:outline-hidden font-bold cursor-pointer"
                >
                  <option value="Luxury Class" className="bg-white text-slate-900">Luxury / Exclusive Tier</option>
                  <option value="Premium Estate" className="bg-white text-slate-900">Premium Private Estate</option>
                  <option value="Aesthetic Loft" className="bg-white text-slate-900">Aesthetic Industrial Loft</option>
                  <option value="Superyacht Deck" className="bg-white text-slate-900">Aviation Hook & Superyachts</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="reg_venue_notes" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Site guidelines</label>
              <textarea
                id="reg_venue_notes"
                value={newVenue.notes}
                onChange={(e) => setNewVenue({ ...newVenue, notes: e.target.value })}
                rows={2}
                placeholder="Decibel guidelines, load-in specifications..."
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-1.5 rounded focus:border-gold-500 focus:outline-hidden font-bold"
              ></textarea>
            </div>
            <div className="flex space-x-3 pt-2 font-mono text-[9px] uppercase tracking-widest font-extrabold">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded cursor-pointer transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded cursor-pointer transition-all shadow-xs"
              >
                Index Venue
              </button>
            </div>
          </form>
        )}

        {/* Ingestion Sub-Form: Staff Registration */}
        {activeModal === 'staff' && (
          <form onSubmit={registerStaff} className="space-y-4">
            <span className="text-[10px] font-display text-gold-700 uppercase tracking-[0.15em] block mb-4 border-b border-slate-200 pb-2 font-bold">
              New Staff Core Enrolment
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg_staff_name" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Given Name</label>
                <input
                  type="text"
                  id="reg_staff_name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  required
                  placeholder="Sophie"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-2 rounded focus:border-gold-500 focus:outline-hidden font-bold"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="reg_staff_surname" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Family Name</label>
                <input
                  type="text"
                  id="reg_staff_surname"
                  value={newStaff.surname}
                  onChange={(e) => setNewStaff({ ...newStaff, surname: e.target.value })}
                  required
                  placeholder="Laurent"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-2 rounded focus:border-gold-500 focus:outline-hidden font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg_staff_role" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Specialist Role</label>
                <select
                  id="reg_staff_role"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2.5 rounded focus:border-gold-500 focus:outline-hidden font-bold cursor-pointer"
                >
                  <option value="Lead VIP Architect" className="bg-white text-slate-900 font-bold">Lead VIP Architect</option>
                  <option value="Corporate Hostess" className="bg-white text-slate-900 font-bold">Corporate Hostess / Guest Rels</option>
                  <option value="Elite Mixologist" className="bg-white text-slate-900 font-bold">Elite Mixologist</option>
                  <option value="Service Supervisor" className="bg-white text-slate-900 font-bold">Service Supervisor</option>
                  <option value="Private Sommelier" className="bg-white text-slate-900 font-bold">Private Sommelier</option>
                  <option value="Tactical Concierge" className="bg-white text-slate-900 font-bold">Safety Concierge</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="reg_staff_rate" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Premium Rate (R/h)</label>
                <input
                  type="number"
                  id="reg_staff_rate"
                  value={newStaff.rate}
                  onChange={(e) => setNewStaff({ ...newStaff, rate: parseInt(e.target.value) || 30 })}
                  required
                  min={15}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2 rounded focus:border-gold-500 focus:outline-hidden font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg_staff_phone" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Mobile (e.g. WhatsApp)</label>
                <input
                  type="text"
                  id="reg_staff_phone"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  required
                  placeholder="+336****1012"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2 rounded focus:border-gold-500 focus:outline-hidden font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="reg_staff_email" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Secure Email</label>
                <input
                  type="email"
                  id="reg_staff_email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  required
                  placeholder="sophie@freshpeople.agency"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-2 py-2 rounded focus:border-gold-500 focus:outline-hidden font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="reg_staff_notes" className="text-[8px] text-slate-650 uppercase tracking-widest block font-bold">Dossier Credentials</label>
              <textarea
                id="reg_staff_notes"
                value={newStaff.notes}
                onChange={(e) => setNewStaff({ ...newStaff, notes: e.target.value })}
                rows={2}
                placeholder="Languages, clearances, specific professional qualifications..."
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 px-3 py-1.5 rounded focus:border-gold-500 focus:outline-hidden font-bold"
              ></textarea>
            </div>
            <div className="flex space-x-3 pt-2 font-mono text-[9px] uppercase tracking-widest font-extrabold">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded cursor-pointer transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded cursor-pointer transition-all shadow-xs"
              >
                Enroll member
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
