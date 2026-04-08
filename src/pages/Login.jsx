import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Teacher') navigate('/teacher');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Teacher') navigate('/teacher');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const demos = [
    { label: 'Admin', email: 'admin@demo.com', color: 'chip-purple' },
    { label: 'Teacher', email: 'teacher@demo.com', color: 'chip-blue' },
    { label: 'Student', email: 'student@demo.com', color: 'chip-green' },
  ];

  return (
    <div className="auth-layout">
      {/* Left — Form */}
      <div className="auth-left">
        <div className="auth-form-box">
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div className="sidebar-logo-icon" style={{ width: 42, height: 42, fontSize: '1.3rem' }}>🎓</div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-1)' }}>CoursePro AI</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intelligence Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '0.35rem', letterSpacing: '-0.03em' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Sign in to continue your learning journey
          </p>

          {/* Error */}
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="cp-input" placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="cp-input" placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-grad" style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.8rem' }}>
              {loading ? '⏳ Signing in…' : '→  Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-2)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Create account →</Link>
          </p>
        </div>
      </div>

      {/* Right — Gradient panel */}
      <div className="auth-right">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🧠</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Elevate your learning
          </h2>
          <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: '320px', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            AI-generated notes, smart summaries, and personalized learning paths — all in one platform.
          </p>

          {/* Feature pills */}
          {['✨ AI Note Generation', '📊 Progress Tracking', '🏆 Certificates', '💬 AI Q&A Chat'].map(f => (
            <div key={f} style={{
              display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)', borderRadius: 99, padding: '0.4rem 1rem',
              fontSize: '0.85rem', fontWeight: 600, margin: '0.25rem', color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)'
            }}>
              {f}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default Login;
