import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState({ data: [], total: 0, page: 1, limit: 10 });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setLoading(true);
    api
      .get(`/assignments/${id}`, { params: { page, limit } })
      .then((res) => {
        setAssignment(res.data.assignment);
        setSubmissions(res.data.submissions ?? { data: [], total: 0, page: 1, limit: 10 });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, page, limit]);

  if (loading && !assignment) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!assignment) return <ErrorMessage message="Assignment not found." />;

  const sub = submissions.data || [];
  const totalSubs = submissions.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalSubs / limit));

  const stateBadge = (state) => {
    if (state === 'TURNED_IN' || state === 'RETURNED') return <Badge variant="success">{state}</Badge>;
    if (state === 'CREATED') return <Badge variant="warning">{state}</Badge>;
    return <Badge variant="default">{state || '—'}</Badge>;
  };

  return (
    <div className="fade-in">
      <div className="detail-header card-accent detail-header-danger">
        <h1 className="page-title">{assignment.title}</h1>
        <span className="badge badge-info">{assignment.courseName}</span>
      </div>

      <div className="detail-meta card">
        <div className="detail-meta-item">
          <span className="detail-meta-label">Course</span>
          <span className="detail-meta-value">{assignment.courseName || '—'}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Max points</span>
          <span className="detail-meta-value">{assignment.maxPoints ?? '—'}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Submissions</span>
          <span className="detail-meta-value">{totalSubs}</span>
        </div>
      </div>

      <section className="detail-section">
        <h2 className="detail-section-title">Submissions</h2>
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {sub.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty-state">No submissions.</td>
                  </tr>
                ) : (
                  sub.map((s) => (
                    <tr key={s.id}>
                      <td>{s.studentName || '—'}</td>
                      <td>{stateBadge(s.state)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalSubs}
            limit={limit}
            onPageChange={setPage}
          />
        </Card>
      </section>
    </div>
  );
}

export default AssignmentDetail;
