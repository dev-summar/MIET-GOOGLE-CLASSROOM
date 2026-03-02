import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import '../styles/pages.css';

function TlcCourseDetail() {
  const { id } = useParams();
  const location = useLocation();
  const initialState = location.state || {};
  const [html, setHtml] = useState('');
  const [meta, setMeta] = useState({
    subjectName: initialState.subjectName || '',
    subjectCode: initialState.subjectCode || '',
    program: initialState.program || '',
    batch: initialState.batch || '',
    semester: '',
    credits: '',
    courseCategory: '',
    instructorName: '',
    instructorDesignation: '',
    instructorDepartment: '',
    instructorPhoto: '',
    description: '',
    outcomes: [],
    evaluation: {
      internalTotal: null,
      externalTotal: null,
      overallTotal: null,
      breakdown: [],
    },
    materials: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setLoading(true);
    axios
      .get('https://pi360.net/site/api/endpoints/api_tlc_content.php', {
        params: {
          institute_id: 'mietjammu',
          course_id: id,
          key: 'R0dqSDg3Njc2cC00NCNAaHg=',
        },
        responseType: 'text',
      })
      .then((res) => {
        const raw = typeof res.data === 'string' ? res.data : '';
        setHtml(raw);
        if (raw && typeof document !== 'undefined') {
          const parsed = parseTlcHtml(raw);
          setMeta((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
        // Fetch structured course materials (if available) from JSON endpoint
        axios
          .get('https://pi360.net/site/api/endpoints/api_tlc_content_details.php', {
            params: {
              institute_id: 'mietjammu',
              course_id: id,
              key: 'R0dqSDg3Njc2cC00NCNAaHg=',
            },
          })
          .then((detailsRes) => {
            const data = detailsRes.data;
            if (data && Array.isArray(data.course_materials)) {
              const materials = mapJsonCourseMaterials(data.course_materials);
              setMeta((prev) => ({
                ...prev,
                materials,
              }));
            }
          })
          .catch((err) => {
            // If materials endpoint fails, keep HTML-based content; don't break page.
            // eslint-disable-next-line no-console
            console.error('[TLC] materials fetch error', err);
          });
      })
      .catch((err) => setError(err.message || 'Unable to fetch TLC data. Please try again later.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!html) return <ErrorMessage message="TLC course not found." />;

  return (
    <div className="fade-in tlc-detail-page">
      <nav className="breadcrumb">
        <Link to="/" className="breadcrumb-link">
          Dashboard
        </Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/tlc-courses" className="breadcrumb-link">
          TLC Courses
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{meta.subjectName || 'Course'}</span>
      </nav>

      <Card className="card-hero tlc-hero">
        <div className="tlc-hero-left">
          <h1 className="page-title tlc-hero-title">{meta.subjectName || 'TLC Course'}</h1>
          <div className="tlc-hero-meta">
            {meta.subjectCode && <Badge variant="default">{meta.subjectCode}</Badge>}
            {meta.courseCategory && <span className="tlc-chip">{meta.courseCategory}</span>}
          </div>
          <div className="tlc-hero-grid">
            <div className="tlc-hero-field">
              <span className="detail-meta-label">Program</span>
              <span className="detail-meta-value tlc-hero-value">{meta.program || '—'}</span>
            </div>
            <div className="tlc-hero-field">
              <span className="detail-meta-label">Batch / Semester</span>
              <span className="detail-meta-value tlc-hero-value">
                {meta.batch || '—'}
                {meta.semester ? ` · Sem ${meta.semester}` : ''}
              </span>
            </div>
            <div className="tlc-hero-field">
              <span className="detail-meta-label">Credits</span>
              <span className="detail-meta-value tlc-hero-value">{meta.credits || '—'}</span>
            </div>
          </div>
        </div>
        <div className="tlc-hero-right">
          <div className="instructor-avatar-lg">
            {meta.instructorPhoto ? (
              <img src={meta.instructorPhoto} alt={meta.instructorName || 'Instructor'} />
            ) : (
              <div className="avatar-placeholder">
                {(meta.instructorName || 'TLC')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="instructor-info">
            <h3 className="instructor-name">{meta.instructorName || '—'}</h3>
            <p className="instructor-meta">
              {meta.instructorDesignation || '—'}
              {meta.instructorDepartment ? ` · ${meta.instructorDepartment}` : ''}
            </p>
          </div>
        </div>
      </Card>

      <div className="tlc-main-grid">
        <section className="detail-section">
          <h2 className="detail-section-title">Course Overview</h2>
          <Card>
            <p className="detail-description">
              {meta.description || 'No description available for this TLC course.'}
            </p>
          </Card>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Course Outcomes</h2>
          <Card className="tlc-outcomes-card">
            {Array.isArray(meta.outcomes) && meta.outcomes.length > 0 ? (
              <ul className="tlc-outcomes-list">
                {meta.outcomes.map((o, idx) => (
                  <li key={idx}>
                    <span className="tlc-outcome-icon">✔</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No outcomes defined.</p>
            )}
          </Card>
        </section>
      </div>

      <section className="detail-section">
        <h2 className="detail-section-title">Evaluation Scheme</h2>
        <Card className="tlc-eval-card">
          <div className="tlc-eval-summary">
            <div className="tlc-eval-pill">
              <span className="tlc-eval-label">Total Internal</span>
              <span className="tlc-eval-value">
                {meta.evaluation.internalTotal != null ? meta.evaluation.internalTotal : '—'}
              </span>
            </div>
            <div className="tlc-eval-pill">
              <span className="tlc-eval-label">Total External</span>
              <span className="tlc-eval-value">
                {meta.evaluation.externalTotal != null ? meta.evaluation.externalTotal : '—'}
              </span>
            </div>
            <div className="tlc-eval-pill">
              <span className="tlc-eval-label">Overall Total</span>
              <span className="tlc-eval-value">
                {meta.evaluation.overallTotal != null ? meta.evaluation.overallTotal : '—'}
              </span>
            </div>
          </div>
          {meta.evaluation.breakdown.length > 0 && (
            <div className="table-wrap tlc-eval-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Marks / Weightage</th>
                  </tr>
                </thead>
                <tbody>
                  {meta.evaluation.breakdown.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.component}</td>
                      <td className="tlc-eval-marks">{row.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">Course Materials</h2>
        <Card>
          {Array.isArray(meta.materials) && meta.materials.length > 0 ? (
            <div className="accordion">
              {meta.materials.map((unit, uIdx) => (
                <details key={uIdx} className="accordion-item" open={uIdx === 0}>
                  <summary className="accordion-summary">
                    <span className="accordion-title">{unit.unitTitle || `Unit ${uIdx + 1}`}</span>
                  </summary>
                  <div className="accordion-content">
                    {(unit.chapters || []).map((ch, cIdx) => (
                      <div key={cIdx} className="accordion-chapter">
                        <div className="accordion-chapter-header">
                          <h3>{ch.title || `Chapter ${cIdx + 1}`}</h3>
                          <div className="accordion-chapter-meta">
                            {ch.updatedAt && <span>Updated: {ch.updatedAt}</span>}
                            {ch.updatedBy && <span> · By {ch.updatedBy}</span>}
                          </div>
                        </div>
                        {Array.isArray(ch.topics) && ch.topics.length > 0 && (
                          <ul className="detail-list">
                            {ch.topics.map((t, tIdx) => (
                              <li key={tIdx}>{t}</li>
                            ))}
                          </ul>
                        )}
                        {Array.isArray(ch.resources) && ch.resources.length > 0 && (
                          <div className="resource-buttons">
                            {ch.resources.map((r, rIdx) => (
                              <Button
                                key={rIdx}
                                variant="primary"
                                className="mr-2 resource-button"
                                onClick={() => {
                                  if (r.url) {
                                    window.open(r.url, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                              >
                                <span className="resource-icon">📄</span>
                                {r.label || r.type || 'Resource'}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="empty-state">No course materials available.</p>
          )}
        </Card>
      </section>
    </div>
  );
}

function mapJsonCourseMaterials(courseMaterials) {
  if (!Array.isArray(courseMaterials)) return [];
  return courseMaterials.map((unit, uIndex) => {
    const chapters = Array.isArray(unit.chapters) ? unit.chapters : [];
    return {
      unitTitle:
        unit.unit_title ||
        unit.unit_name ||
        (typeof unit.unit_number === 'number'
          ? `Unit ${unit.unit_number}`
          : `Unit ${uIndex + 1}`),
      chapters: chapters.map((ch, cIndex) => {
        const topicsArr = Array.isArray(ch.topics) ? ch.topics : [];
        const flatTopics = topicsArr
          .map((t) => t.topic_name || '')
          .filter((name) => !!name);
        const firstTopic = topicsArr[0] || {};
        const allResources = topicsArr.flatMap((t) =>
          Array.isArray(t.resources) ? t.resources : []
        );
        return {
          title:
            ch.chapter_name ||
            (typeof ch.chapter_number === 'number'
              ? `Chapter ${ch.chapter_number}`
              : `Chapter ${cIndex + 1}`),
          topics: flatTopics,
          updatedAt: firstTopic.updated_on || null,
          updatedBy: firstTopic.updated_by || null,
          resources: allResources,
        };
      }),
    };
  });
}

function parseTlcHtml(html) {
  const container = document.createElement('div');
  container.innerHTML = html;

  const getTextAfterLabel = (label) => {
    const p = Array.from(container.querySelectorAll('p')).find((el) =>
      el.textContent.trim().startsWith(label)
    );
    if (!p) return '';
    return p.textContent.replace(label, '').replace(':', '').trim();
  };

  const titleEl = container.querySelector('h2');
  let subjectName = '';
  let subjectCode = '';
  if (titleEl) {
    const titleText = titleEl.textContent.trim();
    const m = titleText.match(/^(.*)\(([^)]+)\)/);
    if (m) {
      subjectName = m[1].trim();
      subjectCode = m[2].trim();
    } else {
      subjectName = titleText;
    }
  }

  const program = getTextAfterLabel('Offered Under Program');
  const courseCategory = getTextAfterLabel('Course Category');
  const semester = getTextAfterLabel('Semester');
  const credits = getTextAfterLabel('Credits');

  const imgEl = container.querySelector('img');
  const instructorPhoto = imgEl ? imgEl.getAttribute('src') : '';

  const instructorP = Array.from(container.querySelectorAll('p')).find((el) =>
    el.innerHTML.includes('Instructor:')
  );
  let instructorName = '';
  let instructorDesignation = '';
  let instructorDepartment = '';
  if (instructorP) {
    const text = instructorP.textContent.replace('Instructor:', '').trim();
    const parts = text.split(',').map((p) => p.trim());
    instructorName = parts[0] || '';
    instructorDesignation = parts[1] || '';
    instructorDepartment = parts.slice(2).join(', ') || '';
  }

  const h3s = Array.from(container.querySelectorAll('h3'));
  const descHeading = h3s.find((h) => h.textContent.includes('Course Description'));
  let description = '';
  if (descHeading) {
    const next = descHeading.nextElementSibling;
    if (next && next.tagName === 'P') {
      description = next.textContent.trim();
    }
  }

  const outcomesHeading = h3s.find((h) => h.textContent.includes('Course Outcomes'));
  let outcomes = [];
  if (outcomesHeading) {
    const ul = outcomesHeading.nextElementSibling;
    if (ul && ul.tagName === 'UL') {
      outcomes = Array.from(ul.querySelectorAll('li'))
        .map((li) => li.textContent.trim())
        .filter(Boolean);
    }
  }

  const evalHeading = h3s.find((h) => h.textContent.includes('Evaluation Scheme'));
  const evaluation = {
    internalTotal: null,
    externalTotal: null,
    overallTotal: null,
    breakdown: [],
  };
  if (evalHeading) {
    const table = evalHeading.nextElementSibling;
    if (table && table.tagName === 'TABLE') {
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      let internal = 0;
      let external = null;
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (!cells.length) return;
        const firstText = cells[0].textContent.trim();
        if (firstText.toLowerCase() === 'total') {
          const lastCell = cells[cells.length - 1];
          const totalVal = parseInt(lastCell.textContent, 10);
          if (!Number.isNaN(totalVal)) {
            evaluation.overallTotal = totalVal;
          }
          return;
        }
        if (cells.length === 3) {
          const comp = cells[0].textContent.trim();
          const internalVal = parseInt(cells[1].textContent, 10);
          const externalVal = parseInt(cells[2].textContent, 10);
          if (!Number.isNaN(internalVal)) {
            internal += internalVal;
            evaluation.breakdown.push({ component: comp, marks: internalVal });
          }
          if (!Number.isNaN(externalVal)) {
            external = (external || 0) + externalVal;
          }
        } else if (cells.length === 2) {
          const comp = cells[0].textContent.trim();
          const marksVal = parseInt(cells[1].textContent, 10);
          if (!Number.isNaN(marksVal)) {
            internal += marksVal;
            evaluation.breakdown.push({ component: comp, marks: marksVal });
          }
        }
      });
      if (internal) evaluation.internalTotal = internal;
      if (external != null) evaluation.externalTotal = external;
    }
  }

  const resourcesHeading = h3s.find((h) => h.textContent.includes('Course Resources'));
  let materials = [];
  if (resourcesHeading) {
    const ul = resourcesHeading.nextElementSibling;
    if (ul && ul.tagName === 'UL') {
      const resources = Array.from(ul.querySelectorAll('a')).map((a) => ({
        label: a.textContent.trim(),
        url: a.getAttribute('href'),
        type: 'Resource',
      }));
      materials = [
        {
          unitTitle: 'Course Resources',
          chapters: [
            {
              title: 'Resources',
              topics: [],
              updatedAt: null,
              updatedBy: null,
              resources,
            },
          ],
        },
      ];
    }
  }

  return {
    subjectName,
    subjectCode,
    program,
    semester,
    credits,
    courseCategory,
    instructorName,
    instructorDesignation,
    instructorDepartment,
    instructorPhoto,
    description,
    outcomes,
    evaluation,
    materials,
  };
}

export default TlcCourseDetail;

