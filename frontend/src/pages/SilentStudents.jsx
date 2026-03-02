import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import Card from '../components/ui/Card';

function SilentStudents() {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(search, 450);

  useEffect(() => setPage(1), [debouncedSearch]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    api
      .get('/silent-students', { params: { page, limit, search: debouncedSearch } })
      .then((res) => {
        setData(res.data.students ?? []);
        setCount(res.data.count ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Silent Students</h1>
          <p className="page-subtitle">No submissions or no activity in last 30 days</p>
        </div>
        <div className="search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setPage(1)} />}

      {loading ? (
        <Spinner />
      ) : (
        <Card className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Last activity</th>
                  <th>Assignments</th>
                  <th>Submitted</th>
                  <th>Missed %</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">No silent students found.</td>
                  </tr>
                ) : (
                  data.map((s) => (
                    <tr key={s.userId}>
                      <td><strong>{s.studentName || '—'}</strong></td>
                      <td>{s.lastActivity || 'None'}</td>
                      <td>{s.totalAssignments ?? 0}</td>
                      <td>{s.submitted ?? 0}</td>
                      <td>{s.missedPercentage ?? 0}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={count} limit={limit} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}

export default SilentStudents;
