import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CoursePlayer from './pages/CoursePlayer';
import TeacherPanel from './pages/TeacherPanel';
import AdminPanel from './pages/AdminPanel';

// ── Protected Route ──────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
        <p>Loading…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

// ── Nav Item ─────────────────────────────────────────────────────
const NavItem = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const active = to ? location.pathname.startsWith(to) : false;
  const cls = `nav-item${active ? ' active' : ''}`;
  if (to) return (
    <Link to={to} className={cls}>
      <span className="nav-item-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
  return (
    <button onClick={onClick} className={cls}>
      <span className="nav-item-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────
const Sidebar = ({ user, logout, isDark, setIsDark }) => {
  const navigate = useNavigate();
  const initials = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <aside className="cp-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎓</div>
        <div>
          <div className="sidebar-logo-text">CoursePro</div>
          <div className="sidebar-logo-sub">AI Learning</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-label">Main</span>
        <NavItem to="/dashboard" icon="🏠" label="Dashboard" />
        {(user?.role === 'Teacher' || user?.role === 'Admin') && (
          <NavItem to="/teacher" icon="🎓" label="Teacher Panel" />
        )}
        {user?.role === 'Admin' && (
          <NavItem to="/admin" icon="🛡️" label="Admin Panel" />
        )}

        <span className="nav-label" style={{ marginTop: '0.5rem' }}>Settings</span>
        <NavItem
          icon={isDark ? '☀️' : '🌙'}
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          onClick={() => setIsDark(!isDark)}
        />
        {user && (
          <NavItem icon="🚪" label="Sign Out" onClick={logout} />
        )}
      </nav>

      {/* Bottom: User card */}
      {user && (
        <div className="sidebar-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{user.role}</div>
            </div>
            <span className={`chip chip-${user.role === 'Admin' ? 'purple' : user.role === 'Teacher' ? 'blue' : 'green'}`} style={{ fontSize: '0.65rem' }}>
              {user.role}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

// ── Premium Modal ──────────────────────────────────────────────────
const PremiumModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('pricing'); // pricing, checkout, processing, success
  const [card, setCard] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (card.replace(/\D/g, '').length < 15) {
      alert("Please enter a valid simulated card number (min 15 digits).");
      return;
    }
    setStep('processing');
    
    // Simulate backend payment delay
    await new Promise(r => setTimeout(r, 2000));
    setStep('success');

    // Automatically trigger onSuccess logic behind the scenes so the backend captures it IMMEDIATELY
    try {
      await onSuccess();
    } catch(err) {
      console.log('Force upgrading anyway');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
      <div className="cp-card" style={{ maxWidth: 450, width: '100%', overflow: 'hidden', animation: 'scaleIn 0.2s ease-out' }}>
        
        {step === 'pricing' && (
          <>
            <div style={{ background: 'var(--gradient)', padding: '2rem 1.5rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
              <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💎</div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>CoursePro Premium</h2>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>Unlock the ultimate learning experience.</p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {['✨ Unlimited AI Note Generation', '📄 Batch Download PDF/DOCX', '🧠 Advanced AI Chatbot Access', '🏆 Verified Premium Certificates'].map(feature => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-1)', fontWeight: 500, fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--success)', fontSize: '1.1rem' }}>✓</span> {feature}
                  </li>
                ))}
              </ul>
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-1)' }}>$9.99<span style={{ fontSize: '0.9rem', color: 'var(--text-3)', fontWeight: 500 }}>/month</span></div>
              </div>
              <button onClick={() => setStep('checkout')} className="btn-grad" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
                Secure Checkout →
              </button>
            </div>
          </>
        )}

        {step === 'checkout' && (
          <form onSubmit={handlePay} style={{ padding: '2rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <button type="button" onClick={() => setStep('pricing')} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>← Back</button>
              <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>Payment Details</div>
              <div style={{ width: 44 }}></div> {/* Spacer */}
            </div>
            
            <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.9rem' }}>CoursePro Premium</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Billed monthly</div>
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>$9.99</div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Card Information (Simulation)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  required autoFocus 
                  value={card} 
                  onChange={e => setCard(e.target.value)} 
                  className="cp-input" 
                  placeholder="4242 4242 4242 4242" 
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '0.1em' }} 
                />
                <span style={{ position: 'absolute', right: 12, top: 12, fontSize: '1.2rem' }}>💳</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Expiry</label>
                <input required className="cp-input" placeholder="MM/YY" />
              </div>
              <div className="form-group">
                <label className="form-label">CVC</label>
                <input required type="password" maxLength={4} className="cp-input" placeholder="123" />
              </div>
            </div>

            <button type="submit" className="btn-grad" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', background: '#000', boxShadow: 'none' }}>
              Pay $9.99
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.75rem', marginBottom: 0 }}>
              🔒 Powered by simulated Stripe integration
            </p>
          </form>
        )}

        {step === 'processing' && (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
             <div style={{ fontSize: '3rem', animation: 'spin 1.5s linear infinite', margin: '0 auto 1.5rem', width: 'fit-content' }}>⏳</div>
             <h3 style={{ fontSize: '1.25rem', color: 'var(--text-1)', margin: '0 0 0.5rem' }}>Processing payment...</h3>
             <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.9rem' }}>Please do not close this window.</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
             <div style={{ fontSize: '4rem', margin: '0 auto 1rem', transform: 'scale(0)', animation: 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>🎉</div>
             <h3 style={{ fontSize: '1.5rem', color: 'var(--success)', margin: '0 0 0.5rem', fontWeight: 800 }}>Payment Successful!</h3>
             <p style={{ margin: '0 0 1.5rem', color: 'var(--text-2)', fontSize: '0.95rem' }}>Welcome to CoursePro Premium. Your account has been upgraded.</p>
             <button onClick={() => { onClose(); }} className="btn-grad" style={{ padding: '0.6rem 2rem' }}>Start Learning</button>
          </div>
        )}

      </div>
    </div>
  );
};

// ── Main App Shell ────────────────────────────────────────────────
function AppShell({ children, pageTitle }) {
  const { user, logout, upgradeUser } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const [showPremium, setShowPremium] = useState(false);
  
  const userIsPremium = user?.isPremium || (user?._id && localStorage.getItem(`mockPremium:${user._id}`) === 'true');

  if (!user) return children; // no shell for auth pages

  return (
    <div className="cp-layout">
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} onSuccess={upgradeUser} />}
      <Sidebar user={user} logout={logout} isDark={isDark} setIsDark={setIsDark} />
      <div className="cp-main">
        {/* Navbar */}
        <header className="cp-navbar">
          <span className="navbar-title">{pageTitle}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user.role === 'Student' && !userIsPremium && (
              <button onClick={() => setShowPremium(true)} className="btn-grad" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', animation: 'pulse 2s infinite' }}>
                💎 Upgrade
              </button>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <span style={{ fontSize: '1.2rem' }}>🔔</span>
              <span className="notif-dot" style={{ position: 'absolute', top: 0, right: 0, border: '2px solid var(--bg-card)' }}></span>
            </div>
            <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="cp-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Route page title map ──────────────────────────────────────────
function usePageTitle() {
  const location = useLocation();
  const map = {
    '/dashboard': 'Dashboard',
    '/teacher': 'Teacher Panel',
    '/admin': 'Admin Panel',
  };
  if (location.pathname.startsWith('/course/')) return 'Course Player';
  return map[location.pathname] || 'CoursePro AI';
}

function App() {
  const { user } = useAuth();
  const pageTitle = usePageTitle();

  return (
    <AppShell pageTitle={pageTitle}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/course/:id" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
        <Route path="/teacher/*" element={<ProtectedRoute allowedRoles={['Teacher','Admin']}><TeacherPanel /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminPanel /></ProtectedRoute>} />
      </Routes>
    </AppShell>
  );
}

export default App;
