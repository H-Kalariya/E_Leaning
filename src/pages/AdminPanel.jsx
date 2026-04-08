import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = '/api';

const STATUS_CHIP = {
  Published:      'chip chip-green',
  PendingApproval:'chip chip-yellow',
  Draft:          'chip chip-gray',
  Rejected:       'chip chip-red',
};

const AdminPanel = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({});

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/course/admin/all`);
      setCourses(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleApprove = async (id) => { await axios.post(`${API_URL}/course/approve/${id}`); fetchCourses(); };
  const handleReject = async (id) => { await axios.post(`${API_URL}/course/reject/${id}`, { reason: rejectReason[id] || 'Does not meet quality standards.' }); fetchCourses(); };

  const pending = courses.filter(c => c.status === 'PendingApproval');
  const all = courses;
  const stats = [
    { label: 'Total Courses', value: all.length, icon: '📚' },
    { label: 'Published', value: all.filter(c=>c.status==='Published').length, icon: '✅' },
    { label: 'Pending Review', value: pending.length, icon: '⏳' },
    { label: 'Rejected', value: all.filter(c=>c.status==='Rejected').length, icon: '❌' },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Review, approve, and manage all platform courses.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending approvals */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-header">
          <h2 className="section-title">⏳ Pending Approvals</h2>
          {pending.length > 0 && <span className="chip chip-yellow">{pending.length} awaiting</span>}
        </div>

        {pending.length === 0 ? (
          <div className="ai-panel">
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-2)' }}>✅ No courses pending approval right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {pending.map(course => (
              <div key={course._id} className="cp-card" style={{ padding: '1.25rem 1.5rem', borderLeft: '3px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>{course.title}</h3>
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.825rem', color: 'var(--text-2)' }}>{course.description}</p>
                    <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-3)' }}>
                      By <strong style={{ color: 'var(--text-2)' }}>{course.teacherId?.name}</strong> · {course.teacherId?.email}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button onClick={() => handleApprove(course._id)} className="btn-grad" style={{ fontSize: '0.825rem', padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      ✅ Approve & Publish
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        className="cp-input"
                        style={{ width: 200, fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                        placeholder="Reason for rejection…"
                        value={rejectReason[course._id] || ''}
                        onChange={e => setRejectReason(prev => ({ ...prev, [course._id]: e.target.value }))}
                      />
                      <button onClick={() => handleReject(course._id)} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 0.875rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All courses table */}
      <div className="section-header">
        <h2 className="section-title">📋 All Courses</h2>
        <span className="chip chip-blue">{all.length} total</span>
      </div>
      <div className="cp-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>
        ) : (
          <table className="cp-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{course.title}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-3)', marginTop: '0.15rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
                    {course.teacherId?.name || '—'}
                  </td>
                  <td>
                    <span className={STATUS_CHIP[course.status] || 'chip chip-gray'}>{course.status}</span>
                    {course.rejectionReason && <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '0.2rem' }}>{course.rejectionReason}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {course.status === 'PendingApproval' && (
                        <button onClick={() => handleApprove(course._id)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          Approve
                        </button>
                      )}
                      {course.status !== 'Draft' && course.status !== 'Rejected' && (
                        <button onClick={() => handleReject(course._id)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default AdminPanel;
