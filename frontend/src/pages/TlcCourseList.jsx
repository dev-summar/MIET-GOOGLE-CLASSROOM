import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useDebounce } from '../hooks/useDebounce';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import '../styles/pages.css';

function TlcCourseList() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(search, 450);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetch = async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await axios.get('https://pi360.net/site/api/endpoints/api_tlc_content.php', {
          params: {
            institute_id: 'mietjammu',
            key: 'R0dqSDg3Njc2cC00NCNAaHg=',
          },
        });
        const all = Array.isArray(res.data) ? res.data : [];
        const normalized = all.map((item) => ({
          subjectId: item.Subject_ID,
          program: item.Program,
          batch: item.Batch,
          subjectName: item.Subject_Name,
          subjectCode: item.Subject_Code,
          courseHandout: item.Course_Handout,
          lessonPlan: item.Lesson_Plan,
        }));
        const filtered = debouncedSearch
          ? normalized.filter((c) =>
              (c.subjectName || '').toLowerCase().includes(debouncedSearch.toLowerCase())
            )
          : normalized;
        const totalItems = filtered.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        setData(filtered.slice(start, end));
        setTotal(totalItems);
      } catch (err) {
        console.error('[TLC] list fetch error', err);
        setError(err.message || 'Unable to fetch TLC data. Please try again later.');
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, limit, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      // No server cache to clear when calling external TLC API directly.
      // Simply reset to first page and refetch.
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">TLC Courses</h1>
          <p className="page-subtitle">Teaching Learning Centre content (read-only)</p>
        </div>
        <div className="page-header-actions">
          <div className="search-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search TLC subjects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            className="ml-2"
            disabled={refreshing}
            onClick={handleRefresh}
          >
            {refreshing ? (
              <>
                <RefreshCw size={16} className="spinner-icon" /> Refreshing…
              </>
            ) : (
              <>
                <RefreshCw size={16} /> Refresh Content
              </>
            )}
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setPage(1)} />}

      {loading ? (
        <Card className="table-card">
          <div className="table-skeleton">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="table-skeleton-row" />
            ))}
          </div>
        </Card>
      ) : (
        <>
          <Card className="table-card tlc-table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Subject Code</th>
                    <th>Program</th>
                    <th>Batch</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        No TLC courses found.
                      </td>
                    </tr>
                  ) : (
                    data.map((c) => (
                      <tr key={c.subjectId} className="tlc-row">
                        <td>
                          <div className="tlc-subject-cell">
                            <strong className="tlc-subject-name">{c.subjectName || '—'}</strong>
                          </div>
                        </td>
                        <td>
                          {c.subjectCode ? (
                            <span className="badge badge-info tlc-code-badge">{c.subjectCode}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{c.program || '—'}</td>
                        <td>{c.batch || '—'}</td>
                        <td>
                          <div className="tlc-actions">
                            <Link
                              to={`/tlc-courses/${encodeURIComponent(c.subjectId)}`}
                              state={{
                                subjectName: c.subjectName,
                                subjectCode: c.subjectCode,
                                program: c.program,
                                batch: c.batch,
                              }}
                              className="btn-link tlc-view-btn"
                            >
                              View details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default TlcCourseList;

