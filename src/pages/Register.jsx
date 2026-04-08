import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
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
      const user = await register(name, email, password, role);
      if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Teacher') navigate('/teacher');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'Student', icon: '🎒', desc: 'Access courses & AI notes' },
    { value: 'Teacher', icon: '🎓', desc: 'Create & manage courses' },
  ];

  return (
    <div className="auth-layout">
      {/* Left — Form */}
      <div className="auth-left">
        <div className="auth-form-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div className="sidebar-logo-icon" style={{ width: 42, height: 42, fontSize: '1.3rem' }}>🎓</div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-1)' }}>CoursePro AI</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intelligence Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '0.35rem', letterSpacing: '-0.03em' }}>
            Create account
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Join thousands of learners and educators
          </p>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="cp-input" placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="cp-input" placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="cp-input" placeholder="Min. 8 characters" />
            </div>

            {/* Role picker */}
            <div className="form-group">
              <label className="form-label">I am a…</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {roles.map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setRole(r.value)}
                    style={{
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                      background: role === r.value ? 'var(--primary-glow)' : 'var(--bg)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{r.icon}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-1)' }}>{r.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-grad" style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.8rem' }}>
              {loading ? '⏳ Creating account…' : '→  Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>

      {/* Right — Gradient panel */}
      <div className="auth-right">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🚀</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Start learning smarter
          </h2>
          <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: '320px', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            AI-powered notes, progress tracking, and certifications for every course.
          </p>
          {['📝 AI-generated summaries', '🧮 LaTeX math rendering', '📄 Download DOCX notes', '🏆 Completion certificates'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', textAlign: 'left', maxWidth: 300, margin: '0 auto 0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>✓</div>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Register;
