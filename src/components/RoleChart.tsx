/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ChartDataItem {
  name: string;
  Hours: number;
  color?: string;
  description?: string;
}

interface RoleChartProps {
  data: ChartDataItem[];
  roleViewTab: 'individual' | 'specialist';
  ROLE_COLORS: Record<string, string>;
}

export default function RoleChart({ data, roleViewTab, ROLE_COLORS }: RoleChartProps) {
  return (
    <div className="w-full h-44 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#475569', fontSize: 7, fontWeight: 'bold' }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 8, fontWeight: 'bold' }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(234, 179, 8, 0.04)' }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#0F172A',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
          />
          <Bar dataKey="Hours" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(entry as any).color || ROLE_COLORS[entry.name] || '#B8860B'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
