import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>
    {/* Navbar */}
    <nav style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="sidebar-logo-icon" style={{ width: 36, height: 36, fontSize: '1.1rem' }}>🎓</div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-1)' }}>CoursePro AI</span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link to="/login" className="btn-outline" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Sign In</Link>
        <Link to="/register" className="btn-grad" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Get Started →</Link>
      </div>
    </nav>

    {/* Hero */}
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-glow)', border: '1px solid rgba(40,53,147,0.2)', borderRadius: 99, padding: '0.35rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '2rem' }}>
        ✨ AI-Powered Learning Platform
      </div>

      <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-1)' }}>
        Learn smarter with{' '}
        <span className="grad-text">AI-generated notes</span>
        {' '}for every lecture
      </h1>

      <p style={{ fontSize: '1.15rem', color: 'var(--text-2)', maxWidth: 640, margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
        CoursePro AI automatically generates structured, LaTeX-ready notes from video transcripts — with headings, formulas, and free DOCX download.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/register" className="btn-grad" style={{ textDecoration: 'none', padding: '0.9rem 2rem', fontSize: '1rem' }}>
          🚀 Start Learning Free
        </Link>
        <Link to="/login" className="btn-outline" style={{ textDecoration: 'none', padding: '0.9rem 2rem', fontSize: '1rem' }}>
          Sign In →
        </Link>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '5rem', textAlign: 'left' }}>
        {[
          { icon: '✨', title: 'AI Note Generation', desc: 'Lecture transcripts → structured notes with headings and bullet points automatically.' },
          { icon: '🧮', title: 'LaTeX Math Support', desc: 'Inline and block equations rendered beautifully with KaTeX — perfect for STEM subjects.' },
          { icon: '📄', title: 'Free DOCX Export', desc: 'Download any course notes as a formatted Word document — free for all users.' },
          { icon: '🏆', title: 'Completion Certificates', desc: 'Earn a certificate when you finish a course. Download as PDF instantly.' },
        ].map(f => (
          <div key={f.title} className="cp-card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.4rem' }}>{f.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Home;
