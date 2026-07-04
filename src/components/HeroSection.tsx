import React from 'react';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6 sm:p-8 mb-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          ESCC
        </h1>
        <p className="text-lg text-gray-300 mb-2">
          Built for Fresh People staffing teams to manage staff, events, and daily operations in one place.
        </p>
        <p className="text-gray-400 mb-6">
          Stop juggling spreadsheets and disconnected tools. Get real-time visibility into your workforce and events.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            View Dashboard
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg border border-gray-700 transition-colors"
          >
            <CalendarPlus size={18} />
            Add Event
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
