import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../ui/Card';

const PRIMARY = '#1e40af';
const FILL = 'url(#atRiskGradient)';
const GRID = '#e2e8f0';

function AtRiskTrend({ data }) {
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  if (chartData.length === 0) {
    return (
      <Card className="chart-card">
        <h3 className="chart-title">At-Risk Students Trend</h3>
        <div className="chart-empty">No trend data yet.</div>
      </Card>
    );
  }
  return (
    <Card className="chart-card">
      <h3 className="chart-title">At-Risk Students</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="atRiskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
              formatter={(value) => [value, 'At-risk']}
            />
            <Area type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} fill={FILL} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default React.memo(AtRiskTrend);
