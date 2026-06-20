/**
 * RoleUtilizationChart.tsx
 * Standalone Role Utilization Dashboard widget with tab switching and legend
 */

import React, { useState, useMemo, Suspense } from 'react';
import { Briefcase } from 'lucide-react';
import RoleChart from './RoleChart';

interface RoleDataItem {
  name: string;
  Hours: number;
  color?: string;
  description?: string;
}

interface PayrollCycleBounds {
  label: string;
  startDateStr: string;
  endDateStr: string;
}

interface RoleUtilizationChartProps {
  roleUtilizationData: RoleDataItem[];
  freshPeopleGroupedData: RoleDataItem[];
  payrollCycleBounds: PayrollCycleBounds;
  ROLE_COLORS: Record<string, string>;
}

const RoleUtilizationChart: React.FC<RoleUtilizationChartProps> = ({
  roleUtilizationData,
  freshPeopleGroupedData,
  payrollCycleBounds,
  ROLE_COLORS,
}) => {
  const [roleViewTab, setRoleViewTab] = useState<'individual' | 'specialist'>('specialist');

  const displayData = roleViewTab === 'specialist' ? freshPeopleGroupedData : roleUtilizationData;

  const hasNoData = useMemo(() => {
    return displayData.length === 0 || (roleViewTab === 'specialist' && freshPeopleGroupedData.every(i => i.Hours === 0));
  }, [displayData, roleViewTab, freshPeopleGroupedData]);

  return (
    <div className="glass-panel rounded-lg p-5 shadow-luxury-glow flex flex-col">
      <div className="flex items-center justify-between mb-3.5 border-b border-slate-200/60 pb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-800 font-display flex items-center gap-1.5 font-bold">
          <Briefcase className="w-4 h-4 text-gold-600 animate-pulse" /> Role Utilization Chart
        </span>
        <span className="font-mono text-[8.5px] px-2 py-0.5 bg-gold-50 border border-gold-200/40 rounded-full text-gold-700 uppercase tracking-widest font-bold">
          {payrollCycleBounds.label}
        </span>
      </div>

      {/* View Tab Selector */}
      <div className="flex bg-slate-100 p-0.5 rounded-md mb-4 text-[8.5px] font-mono leading-none">
        <button
          type="button"
          onClick={() => setRoleViewTab('specialist')}
          className={`flex-1 py-1.5 rounded-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            roleViewTab === 'specialist'
              ? 'bg-white text-gold-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Specialists (fresh-people.co.za)
        </button>
        <button
          type="button"
          onClick={() => setRoleViewTab('individual')}
          className={`flex-1 py-1.5 rounded-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            roleViewTab === 'individual'
              ? 'bg-white text-gold-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Individual Roles
        </button>
      </div>

      <p className="text-[10px] text-slate-600 mb-3.5 font-medium leading-relaxed">
        {roleViewTab === 'specialist'
          ? 'Total booked hours aggregated across core South African event specialty classes.'
          : 'Total hours booked per specific individual assignment role type.'}
      </p>

      <div className="w-full h-44 mt-1">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">Loading chart...</div>}>
          <RoleChart
            data={displayData}
            roleViewTab={roleViewTab}
            ROLE_COLORS={ROLE_COLORS}
          />
        </Suspense>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-105 space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
        {roleViewTab === 'specialist' ? (
          freshPeopleGroupedData.map((item) => (
            <div key={item.name} className="p-2 border border-slate-200/50 bg-slate-50/45 rounded-md transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-slate-800 font-extrabold tracking-tight">{item.name}</span>
                </div>
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-gold-50 text-gold-700 font-extrabold border border-gold-200/40 rounded">
                  {item.Hours.toFixed(1)} hrs
                </span>
              </div>
              <p className="text-[8.5px] text-slate-500 font-semibold leading-normal pl-4.5">
                {item.description}
              </p>
            </div>
          ))
        ) : (
          roleUtilizationData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-[10px] font-mono px-1 py-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: ROLE_COLORS[item.name] || '#B8860B' }}
                ></span>
                <span className="text-slate-705 font-bold">{item.name}</span>
              </div>
              <span className="font-extrabold text-slate-905">
                {item.Hours.toFixed(1)} hrs
              </span>
            </div>
          ))
        )}
        {hasNoData && (
          <div className="text-center text-[9px] text-slate-400 py-3 font-medium">
            No hours scheduled in this payroll span.
          </div>
        )}
        
        {/* Verified Badge pointing to fresh-people.co.za */}
        <div className="mt-3.5 pt-2.5 border-t border-dotted border-slate-200 text-center">
          <p className="text-[8px] text-slate-500 tracking-wider font-semibold leading-relaxed">
            🌿 Specialist classifications &amp; credentials align with active roster guidelines on{' '}
            <a
              href="https://fresh-people.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-700 hover:underline font-extrabold"
            >
              fresh-people.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleUtilizationChart;
