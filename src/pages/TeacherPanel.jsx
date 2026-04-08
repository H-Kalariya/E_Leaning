import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = '/api';

const STATUS_CHIP = {
  Draft:          'chip chip-gray',
  PendingApproval:'chip chip-yellow',
  Published:      'chip chip-green',
  Rejected:       'chip chip-red',
};

const TeacherPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/course/teacher`);
      setCourses(res.data);
      res.data.forEach(c => fetchVideos(c._id));
    } catch (e) { console.error(e); }
  };

  const fetchVideos = async (courseId) => {
    try {
      const res = await axios.get(`${API_URL}/video/${courseId}`);
      setVideos(prev => ({ ...prev, [courseId]: res.data }));
    } catch (e) {}
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${API_URL}/course/create`, { title, description });
      setTitle(''); setDescription('');
      fetchCourses();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create course');
    } finally { setCreating(false); }
  };

  const handleSubmitForApproval = async (id) => {
    try {
      const res = await axios.post(`${API_URL}/course/publish/${id}`);
      alert(res.data.message);
      fetchCourses();
    } catch (e) { alert(e.response?.data?.message || 'Failed to submit'); }
  };

  const handleUploadVideo = async (courseId, e) => {
    e.preventDefault();
    const file = e.target.video.files[0];
    const vtitle = e.target.vtitle.value;
    const formData = new FormData();
    formData.append('video', file);
    formData.append('courseId', courseId);
    formData.append('title', vtitle);
    try {
      await axios.post(`${API_URL}/video/upload`, formData);
      alert('Video Uploaded ✅');
      e.target.reset();
      fetchVideos(courseId);
    } catch { alert('Upload failed'); }
  };

  const handleAddYoutube = async (courseId, e) => {
    e.preventDefault();
    const vtitle = e.target.vtitle.value;
    const youtubeUrl = e.target.youtubeUrl.value;
    try {
      await axios.post(`${API_URL}/video/add-youtube`, { courseId, title: vtitle, youtubeUrl });
      alert('YouTube Video Added ✅');
      e.target.reset();
      fetchVideos(courseId);
    } catch { alert('Failed to add YouTube video'); }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Teacher Panel</h1>
        <p className="page-subtitle">Create courses, add videos, and submit for admin approval.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Create Course Form ── */}
        <div className="cp-card" style={{ padding: '1.5rem', position: 'sticky', top: '1rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2 className="section-title">➕ New Course</h2>
          </div>
          <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Course Title</label>
              <input className="cp-input" placeholder="e.g. React & AI Fundamentals" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="cp-input" placeholder="What will students learn?" value={description} onChange={e => setDescription(e.target.value)} required rows={4} style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={creating} className="btn-grad" style={{ justifyContent: 'center' }}>
              {creating ? '⏳ Creating…' : '✨ Create Draft'}
            </button>
          </form>

          {/* Stats */}
          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Total', value: courses.length, color: 'var(--text-1)' },
              { label: 'Published', value: courses.filter(c => c.status === 'Published').length, color: 'var(--success)' },
              { label: 'Pending', value: courses.filter(c => c.status === 'PendingApproval').length, color: 'var(--warning)' },
              { label: 'Drafts', value: courses.filter(c => c.status === 'Draft').length, color: 'var(--text-3)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Course List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="section-header">
            <h2 className="section-title">📚 Your Courses</h2>
            <span className="chip chip-blue">{courses.length} total</span>
          </div>

          {courses.length === 0 && (
            <div className="cp-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
              <p style={{ margin: 0 }}>No courses yet. Create your first course →</p>
            </div>
          )}

          {courses.map(course => {
            const courseVideos = videos[course._id] || [];
            const isExpanded = expandedCourse === course._id;
            return (
              <div key={course._id} className="cp-card" style={{ overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>{course.title}</h3>
                      <span className={STATUS_CHIP[course.status] || 'chip chip-gray'}>{course.status}</span>
                      <span className="chip chip-blue">📹 {courseVideos.length} videos</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{course.description}</p>
                    {course.rejectionReason && (
                      <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--danger)' }}>❌ {course.rejectionReason}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(`/course/${course._id}`)} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 0.875rem' }}>
                      👁 Preview
                    </button>
                    {(course.status === 'Draft' || course.status === 'Rejected') && (
                      <button onClick={() => handleSubmitForApproval(course._id)} className="btn-grad" style={{ fontSize: '0.8rem', padding: '0.45rem 0.875rem' }}>
                        📤 Submit
                      </button>
                    )}
                    <button onClick={() => setExpandedCourse(isExpanded ? null : course._id)} className="btn-ghost" style={{ fontSize: '0.8rem' }}>
                      {isExpanded ? '▲ Less' : '▼ Add Videos'}
                    </button>
                  </div>
                </div>

                {/* Video list */}
                {courseVideos.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.5rem', background: 'var(--bg)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {courseVideos.map((v, i) => (
                      <span key={v._id} className="chip chip-gray" style={{ fontSize: '0.775rem' }}>
                        {i + 1}. {v.title} {v.url?.includes('youtube') ? '▶' : '📁'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add video forms */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Upload file */}
                    <div>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-1)' }}>⬆ Upload Video File</p>
                      <form onSubmit={e => handleUploadVideo(course._id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input name="vtitle" className="cp-input" placeholder="Video title" required style={{ fontSize: '0.825rem' }} />
                        <input type="file" name="video" accept="video/*" required className="cp-input" style={{ fontSize: '0.825rem', padding: '0.5rem' }} />
                        <button type="submit" className="btn-outline" style={{ fontSize: '0.825rem', justifyContent: 'center' }}>Upload</button>
                      </form>
                    </div>
                    {/* YouTube */}
                    <div>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-1)' }}>🔗 Add YouTube Link</p>
                      <form onSubmit={e => handleAddYoutube(course._id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input name="vtitle" className="cp-input" placeholder="Video title" required style={{ fontSize: '0.825rem' }} />
                        <input name="youtubeUrl" className="cp-input" placeholder="https://youtube.com/…" required style={{ fontSize: '0.825rem' }} />
                        <button type="submit" className="btn-grad" style={{ fontSize: '0.825rem', justifyContent: 'center', background: '#dc2626' }}>Add YouTube</button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default TeacherPanel;
