import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_URL = '/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Extra layer of redundancy to ensure UI updates instantly even if context lags
  const userIsPremium = user?.isPremium || (user?._id && localStorage.getItem(`mockPremium:${user._id}`) === 'true');

  useEffect(() => {
    axios.get(`${API_URL}/course/all`)
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const courseEmojis = ['⚛️', '🐍', '🌐', '🧠', '📊', '🔬', '🎨', '🛡️'];

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Continue your learning journey — AI notes available on every course.</p>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value grad-text">{courses.length}</div>
          <div className="stat-label">📚 Courses Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-value grad-text">∞</div>
          <div className="stat-label">✨ AI Notes Access</div>
        </div>
        <div className="stat-card">
          <div className="stat-value grad-text">🆓</div>
          <div className="stat-label">📄 Free Downloads</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--gradient)', border: 'none' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: '0.25rem' }}>
            {user?.role}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>🎭 Your Role</div>
        </div>
      </div>

      {/* AI insight panel */}
      {user?.role === 'Student' && !userIsPremium ? (
        <div className="ai-panel" style={{ marginBottom: '2rem', background: 'var(--primary-glow)', border: '1px solid rgba(40,53,147,0.3)' }}>
          <div className="ai-panel-title" style={{ color: 'var(--primary)' }}>🔒 Premium Required</div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            Please upgrade on your Dashboard to view AI generated notes. Click the 💎 Upgrade button above to get started.
          </p>
        </div>
      ) : (
        <div className="ai-panel" style={{ marginBottom: '2rem' }}>
          <div className="ai-panel-title">✨ AI Insight</div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            All courses include <strong style={{ color: 'var(--text-1)' }}>AI-generated notes</strong> with full LaTeX math rendering and free DOCX download. Pick a course below to get started.
          </p>
        </div>
      )}

      {/* Courses grid */}
      <div className="section-header">
        <h2 className="section-title">📚 Available Courses</h2>
        <span className="chip chip-blue">{courses.length} courses</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <p>Loading courses…</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {courses.map((course, i) => (
            <div key={course._id} className="course-card">
              <div className="course-card-thumb">
                {courseEmojis[i % courseEmojis.length]}
              </div>
              <div className="course-card-body">
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">{course.description}</p>
                <div className="course-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div className="avatar" style={{ width: 26, height: 26, fontSize: '0.65rem' }}>
                      {course.teacherId?.name?.charAt(0) || 'T'}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                      {course.teacherId?.name || 'Instructor'}
                    </span>
                  </div>
                  <Link
                    to={`/course/${course._id}`}
                    className="btn-grad"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    Start →
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
              <p style={{ margin: 0, fontSize: '1rem' }}>No published courses yet. Check back soon!</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Dashboard;
