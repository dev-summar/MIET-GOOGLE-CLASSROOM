import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  BookOpen,
  Users,
  UserSquare2,
  FileText,
  RefreshCw,
  BarChart3,
  ArrowRight,
  MessageSquareOff,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { formatNumber } from '../utils';

const CARD_DATA = [
  { label: 'Total Courses', key: 'courses', icon: BookOpen, color: '#1e40af', path: '/courses' },
  { label: 'Total Teachers', key: 'teachers', icon: UserSquare2, color: '#f59e0b', path: '/teachers' },
  { label: 'Total Students', key: 'students', icon: Users, color: '#10b981', path: '/students' },
  { label: 'Total Assignments', key: 'assignments', icon: FileText, color: '#ef4444', path: '/assignments' },
  { label: 'Total Submissions', key: 'submissions', icon: BarChart3, color: '#8b5cf6', path: '/assignments' },
  { label: 'Silent Students', key: 'silent', icon: MessageSquareOff, color: '#be123c', path: '/silent-students' },
  { label: 'At-Risk Students', key: 'atRisk', icon: AlertTriangle, color: '#c2410c', path: '/at-risk-students' },
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [extraCounts, setExtraCounts] = useState({ silent: 0, atRisk: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setError(null);
    try {
      const [statsRes, silentRes, atRiskRes] = await Promise.all([
        api.get('/stats'),
        api.get('/silent-students', { params: { page: 1, limit: 1 } }),
        api.get('/at-risk-students', { params: { page: 1, limit: 1 } }),
      ]);
      setStats(statsRes.data);
      setExtraCounts({
        silent: silentRes.data.count ?? 0,
        atRisk: atRiskRes.data.count ?? 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const pollSyncStatus = async (jobId) => {
    const maxAttempts = 60; // up to ~2 minutes
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await api.get('/sync/status', { params: { jobId } });
      const status = res.data.status;
      if (status === 'success' || status === 'completed') {
        return res.data;
      }
      if (status === 'failed') {
        throw new Error(res.data.error || 'Sync failed.');
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error('Sync is taking longer than expected. Please try again later.');
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    setError(null);
    try {
      const { data } = await api.post('/sync/all');
      const jobId = data.jobId;
      if (!jobId) {
        throw new Error('Failed to start sync.');
      }
      await pollSyncStatus(jobId);
      await fetchAll();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <Spinner size={48} />
      </div>
    );
  }

  const displayStats = {
    ...stats,
    silent: extraCounts.silent,
    atRisk: extraCounts.atRisk,
  };

  return (
    <div className="fade-in dashboard-page">
      <div className="page-header dashboard-header">
        <div>
          <h1 className="page-title">Institutional Overview</h1>
          <p className="page-subtitle">Real-time analytics for Classroom ecosystem</p>
        </div>
        <div className="dashboard-sync-row">
          {syncSuccess && (
            <span className="dashboard-sync-success">
              <CheckCircle2 size={18} /> Sync complete
            </span>
          )}
          <Button variant="primary" disabled={syncing} onClick={handleSync} className="btn-sync">
            {syncing ? <RefreshCw size={18} className="spinner-icon" /> : <RefreshCw size={18} />}
            {syncing ? 'Syncing…' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={fetchAll} />
      )}

      <div className="dashboard-cards-grid">
        {CARD_DATA.map(({ label, key, icon: Icon, color, path }) => (
          <Link to={path} key={key} className="dashboard-stat-card">
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: `${color}18`, color }}>
                <Icon size={24} />
              </div>
              <span className="stat-label">{label}</span>
              <div className="stat-number">{formatNumber(displayStats?.[key]) ?? 0}</div>
              <span className="stat-link" style={{ color }}>
                View details <ArrowRight size={14} />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="dashboard-bottom-grid">
        <Card>
          <h2 className="dashboard-section-title">
            <TrendingUp size={20} /> Engagement summary
          </h2>
          <div className="dashboard-status-list">
            <div className="dashboard-status-item">
              <span className="dashboard-status-item-label">Courses (active)</span>
              <span className="badge badge-active">{formatNumber(stats?.courses)}</span>
            </div>
            <div className="dashboard-status-item">
              <span className="dashboard-status-item-label">Silent students</span>
              <span className="badge badge-danger">{formatNumber(extraCounts.silent)}</span>
            </div>
            <div className="dashboard-status-item">
              <span className="dashboard-status-item-label">At-risk students</span>
              <span className="badge badge-warning">{formatNumber(extraCounts.atRisk)}</span>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="dashboard-section-title">System status</h2>
          <div className="dashboard-status-list">
            <div className="dashboard-status-item">
              <span className="dashboard-status-item-label">Classroom API</span>
              <span className="badge badge-active">Connected</span>
            </div>
            <div className="dashboard-status-item">
              <span className="dashboard-status-item-label">Database</span>
              <span className="badge badge-active">Stable</span>
            </div>
          </div>
          <p className="dashboard-status-msg">All systems operating normally.</p>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
