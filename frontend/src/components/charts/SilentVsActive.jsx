import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';

const ACTIVE_COLOR = '#10b981';
const SILENT_COLOR = '#be123c';

function SilentVsActive({ totalStudents, silentCount }) {
  const chartData = useMemo(() => {
    const active = Math.max(0, (totalStudents ?? 0) - (silentCount ?? 0));
    const silent = silentCount ?? 0;
    if (active === 0 && silent === 0) return [];
    return [
      { name: 'Active', value: active, color: ACTIVE_COLOR },
      { name: 'Silent', value: silent, color: SILENT_COLOR },
    ].filter((d) => d.value > 0);
  }, [totalStudents, silentCount]);

  if (chartData.length === 0) {
    return (
      <Card className="chart-card">
        <h3 className="chart-title">Silent vs Active</h3>
        <div className="chart-empty">No student data yet.</div>
      </Card>
    );
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="chart-card">
      <h3 className="chart-title">Student Health</h3>
      <div className="chart-container chart-container--donut">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
              formatter={(value, name) => [value, name]}
            />
            <Legend verticalAlign="bottom" height={36} formatter={(value, entry) => `${value} (${entry.payload.value})`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-donut-center">
          <span className="chart-donut-total">{total}</span>
          <span className="chart-donut-label">Total</span>
        </div>
      </div>
    </Card>
  );
}

export default React.memo(SilentVsActive);
