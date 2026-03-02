import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setLoading(true);
    api
      .get(`/courses/${id}`)
      .then((res) => {
        setCourse(res.data.course);
        setTeachers(res.data.teachers ?? []);
        setStudents(res.data.students ?? []);
        setAssignments(res.data.assignments ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!course) return <ErrorMessage message="Course not found." />;

  return (
    <div className="fade-in">
      <div className="detail-header card-accent">
        <h1 className="page-title">{course.name}</h1>
        {course.section && (
          <Badge variant="default">{course.section}</Badge>
        )}
      </div>

      <div className="detail-meta card">
        <div className="detail-meta-item">
          <span className="detail-meta-label">Teachers</span>
          <span className="detail-meta-value">{teachers.length}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Students</span>
          <span className="detail-meta-value">{students.length}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Assignments</span>
          <span className="detail-meta-value">{assignments.length}</span>
        </div>
      </div>

      <div className="detail-tabs">
        <section className="detail-section">
          <h2 className="detail-section-title">Teachers</h2>
          <Card>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="empty-state">No teachers.</td>
                    </tr>
                  ) : (
                    teachers.map((t) => (
                      <tr key={t.userId}>
                        <td>{t.name || '—'}</td>
                        <td>{t.email || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Students</h2>
          <Card>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="empty-state">No students.</td>
                    </tr>
                  ) : (
                    students.slice(0, 50).map((s) => (
                      <tr key={s.userId}>
                        <td>{s.name || '—'}</td>
                        <td>{s.email || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {students.length > 50 && (
              <p className="detail-more">Showing first 50 of {students.length} students.</p>
            )}
          </Card>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Assignments</h2>
          <Card>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Max points</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-state">No assignments.</td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.id}>
                        <td>{a.title || '—'}</td>
                        <td>{a.maxPoints ?? '—'}</td>
                        <td>
                          <Link to={`/assignments/${a.id}`} className="btn-link">View</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default CourseDetail;
