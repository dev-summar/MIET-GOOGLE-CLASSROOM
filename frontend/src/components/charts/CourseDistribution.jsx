import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../ui/Card';

const PRIMARY = '#1e40af';
const GRID = '#e2e8f0';

function truncate(str, max = 18) {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 2) + '…';
}

function CourseDistribution({ data }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.slice(0, 12).map((c) => ({
      name: truncate(c.name || 'Course'),
      students: c.studentCount ?? 0,
    }));
  }, [data]);
  if (chartData.length === 0) {
    return (
      <Card className="chart-card">
        <h3 className="chart-title">Course Distribution</h3>
        <div className="chart-empty">No course data yet.</div>
      </Card>
    );
  }
  return (
    <Card className="chart-card">
      <h3 className="chart-title">Students per Course</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
              formatter={(value) => [value, 'Students']}
            />
            <Bar dataKey="students" fill={PRIMARY} radius={[0, 4, 4, 0]} name="Students" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default React.memo(CourseDistribution);
