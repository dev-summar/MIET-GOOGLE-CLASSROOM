import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import Card from '../components/ui/Card';
import '../styles/pages.css';

function CourseList() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(search, 450);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    api
      .get('/courses', { params: { page, limit, search: debouncedSearch } })
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
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">Active courses from sync year</p>
        </div>
        <div className="search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setPage(1)} />}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <Card className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Teachers</th>
                    <th>Students</th>
                    <th>Assignments</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    data.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name || '—'}</strong>
                        </td>
                        <td>
                          <span className="badge badge-default">{c.section || '—'}</span>
                        </td>
                        <td>{c.teacherCount ?? 0}</td>
                        <td>{c.studentCount ?? 0}</td>
                        <td>{c.assignmentCount ?? 0}</td>
                        <td>
                          <Link to={`/courses/${c.id}`} className="btn-link">
                            View
                          </Link>
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

export default CourseList;
