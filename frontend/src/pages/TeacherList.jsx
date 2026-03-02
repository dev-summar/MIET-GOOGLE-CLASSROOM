import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import Card from '../components/ui/Card';

function TeacherList() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
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
      .get('/teachers', { params: { page, limit, search: debouncedSearch } })
      .then((res) => {
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">Unique teachers across active courses</p>
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
                  <th>Email</th>
                  <th>Courses</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state">No teachers found.</td>
                  </tr>
                ) : (
                  data.map((t) => (
                    <tr key={t.userId}>
                      <td><strong>{t.name || '—'}</strong></td>
                      <td>{t.email || '—'}</td>
                      <td>{t.courseCount ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}

export default TeacherList;
