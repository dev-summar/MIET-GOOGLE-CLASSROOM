import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../ui/Card';

const PRIMARY = '#1e40af';
const GRID = '#e2e8f0';

function SubmissionsOverTime({ data }) {
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  if (chartData.length === 0) {
    return (
      <Card className="chart-card">
        <h3 className="chart-title">Submissions Over Time</h3>
        <div className="chart-empty">No submission data yet.</div>
      </Card>
    );
  }
  return (
    <Card className="chart-card">
      <h3 className="chart-title">Submissions Over Time</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              formatter={(value) => [value, 'Submissions']}
            />
            <Line type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} dot={{ fill: PRIMARY, r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default React.memo(SubmissionsOverTime);
