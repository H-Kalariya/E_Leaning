import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API_URL = '/api';

// ─── Certificate Component ────────────────────────────────────────────────────
const Certificate = ({ userName, courseTitle, onClose }) => {
  const certRef = useRef();
  const [downloading, setDownloading] = useState(false);

  const downloadCert = async () => {
    try {
      setDownloading(true);
      // Clone the cert node so external styles don't interfere
      const node = certRef.current;
      // html2pdf.js relies on html2canvas so we must ensure images load
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [5, 5, 5, 5],
          filename: `Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 3, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        })
        .from(node)
        .save();
    } catch (e) {
      console.error('Certificate download failed:', e);
      alert('PDF download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    // Overlay — clicking it does NOT close the modal (prevents accidental close)
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/80 p-4">
      {/* Modal card — stop propagation so clicks inside never hit overlay */}
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Certificate body (this gets exported to PDF) */}
        <div
          ref={certRef}
          className="p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: '#fff',
            fontFamily: 'Georgia, serif',
          }}
        >
          <div style={{ border: '4px solid #f59e0b', borderRadius: '12px', padding: '32px' }}>
            <p style={{ color: '#f59e0b', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
              CoursePro AI
            </p>
            <h1 style={{ fontSize: '52px', fontWeight: 'bold', color: '#fcd34d', margin: '0 0 8px' }}>Certificate</h1>
            <p style={{ fontSize: '18px', color: '#d1d5db', marginBottom: '24px' }}>of Course Completion</p>
            <p style={{ fontSize: '20px', color: '#fff', marginBottom: '4px' }}>This is to certify that</p>
            <h2 style={{ fontSize: '40px', fontWeight: 'bold', color: '#fde68a', borderBottom: '2px solid #f59e0b', paddingBottom: '16px', display: 'inline-block', marginBottom: '16px', padding: '0 32px 16px' }}>
              {userName}
            </h2>
            <p style={{ fontSize: '20px', color: '#fff', marginTop: '16px' }}>has successfully completed</p>
            <h3 style={{ fontSize: '30px', fontWeight: '600', color: '#fef9c3', margin: '8px 0 24px' }}>
              &ldquo;{courseTitle}&rdquo;
            </h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '16px' }}>
              Issued on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-5 bg-gray-100 justify-end items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-400 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            ✖ Close
          </button>
          <button
            type="button"
            onClick={downloadCert}
            disabled={downloading}
            className="px-6 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-60"
          >
            {downloading ? '⏳ Generating PDF…' : '⬇ Download Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── Main CoursePlayer ────────────────────────────────────────────────────────
const CoursePlayer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const userIsPremium = user?.isPremium || localStorage.getItem('mockPremium') === 'true';

  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');

  // Notes state
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Progress & Certificate state
  const [completedVideos, setCompletedVideos] = useState([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isCourseComplete, setIsCourseComplete] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // ── Load course info ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videoRes, courseRes] = await Promise.all([
          axios.get(`${API_URL}/video/${id}`),
          axios.get(`${API_URL}/course/all`),
        ]);
        const vids = videoRes.data;
        setVideos(vids);
        setTotalVideos(vids.length);
        if (vids.length > 0) setActiveVideo(vids[0]);

        const course = courseRes.data.find(c => c._id === id);
        if (course) setCourseTitle(course.title);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [id]);

  // ── Load progress ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`${API_URL}/progress/${id}`);
        setCompletedVideos(res.data.progress || []);
        setIsCourseComplete(res.data.isCompleted || false);
      } catch (e) {
        // progress may not exist yet — that's fine
      }
    };
    fetchProgress();
  }, [id, user]);

  // ── Load notes whenever active video changes ────────────────────────────────
  useEffect(() => {
    if (activeVideo) fetchNotes(activeVideo._id);
  }, [activeVideo]);

  // ── Normalize LaTeX delimiters: converts \( \) → $..$ and \[ \] → $$..$$
  const normalizeLatex = (text) => {
    if (!text) return text;
    return text
      .replace(/\\\[\s*/g, '$$\n')   // \[ → $$
      .replace(/\s*\\\]/g, '\n$$')   // \] → $$
      .replace(/\\\(/g, '$')         // \( → $
      .replace(/\\\)/g, '$');        // \) → $
  };

  const fetchNotes = async (videoId) => {
    setNotes('');
    setNoteError('');
    setIsEditingMode(false);
    try {
      const res = await axios.get(`${API_URL}/notes/${videoId}`);
      if (res.data && res.data.length > 0) {
        setNotes(normalizeLatex(res.data[0].content));
        setEditingNotes(res.data[0].content);
      } else {
        setNoteError(user?.role === 'Teacher'
          ? 'No notes yet. Click "Generate AI Summary" to create them.'
          : 'No AI Notes have been generated by the Teacher for this video yet.');
      }
    } catch (e) {
      setNoteError(e.response?.data?.message || 'Failed to load notes.');
    }
  };

  // ── Generate notes (Teacher only) ──────────────────────────────────────────
  const handleGenerateNotes = async () => {
    if (!activeVideo || user?.role !== 'Teacher') return;
    setNoteLoading(true);
    setNotes('');
    setNoteError('Generating AI Summary… This may take up to a minute ⏳');
    try {
      const transcriptRes = await axios.post('http://localhost:3001/api/transcript', { url: activeVideo.url });
      if (!transcriptRes.data.transcripts?.length) throw new Error('No transcript found');

      const fullText = transcriptRes.data.transcripts.map(t => t.text).join(' ');
      const aiRes = await axios.post('http://localhost:3001/api/summarize', { transcript: fullText });
      const summary = aiRes.data.summary;
      const normalized = normalizeLatex(summary);

      // Auto-save to DB
      await axios.post(`${API_URL}/notes/save`, { videoId: activeVideo._id, content: summary });
      setNotes(normalized);
      setEditingNotes(summary);
      setNoteError('');
    } catch (e) {
      setNotes('');
      setNoteError('❌ Failed to generate. Ensure Python microservice is running and the video has closed captions.');
    } finally {
      setNoteLoading(false);
    }
  };

  // ── Save edited notes (Teacher only) ───────────────────────────────────────
  const handleSaveNotes = async () => {
    try {
      await axios.post(`${API_URL}/notes/save`, { videoId: activeVideo._id, content: editingNotes });
      setNotes(editingNotes);
      setIsEditingMode(false);
      setNoteError('');
    } catch (e) {
      setNoteError('Failed to save notes.');
    }
  };

  // ── Download notes as Word doc (Student) ───────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!notes) return;
    try {
      const title = activeVideo?.title || 'AI Notes';
      const resp = await axios.post(
        'http://localhost:3001/api/export-docx',
        { content: notes, title },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Notes_${title.replace(/\s+/g, '_')}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed. Ensure Python server is running.');
    }
  };

  // ── Mark video complete ─────────────────────────────────────────────────────
  const handleMarkComplete = async (videoId) => {
    try {
      const res = await axios.post(`${API_URL}/progress/mark`, { videoId, courseId: id });
      setCompletedVideos(res.data.progress?.completedVideos || []);
      setIsCourseComplete(res.data.isCompleted || false);
    } catch (e) {
      console.error(e);
    }
  };

  // ── YouTube embed URL extraction ────────────────────────────────────────────
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match && match[1]
      ? `https://www.youtube.com/embed/${match[1]}?cc_load_policy=1&cc_lang_pref=en`
      : url;
  };

  // ── Theme classes ───────────────────────────────────────────────────────────
  const card = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const inputCls = isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  const completionPct = totalVideos > 0 ? Math.round((completedVideos.length / totalVideos) * 100) : 0;

  return (
    <div className={`max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 ${isDark ? 'text-white' : ''}`}>

      {/* ── Certificate Modal ── */}
      {showCertificate && (
        <Certificate
          userName={user?.name || 'Student'}
          courseTitle={courseTitle}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* ── LEFT: Video + Notes ── */}
      <div className="w-full md:w-3/4 flex flex-col gap-6">

        {/* Video Player */}
        {activeVideo ? (
          <>
            <div className="bg-black rounded-xl overflow-hidden shadow-xl aspect-video">
              {activeVideo.url.includes('youtube') || activeVideo.url.includes('youtu.be') ? (
                <iframe
                  key={activeVideo._id}
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(activeVideo.url)}
                  title="Course Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  key={activeVideo._id}
                  src={activeVideo.url.startsWith('http') ? activeVideo.url : activeVideo.url}
                  controls
                  className="w-full h-full"
                  autoPlay
                >
                  <track kind="captions" label="Captions" default />
                </video>
              )}
            </div>

            {/* Video title + Mark Complete */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-2xl font-bold">{activeVideo.title}</h2>
              {user?.role === 'Student' && (
                <button
                  onClick={() => handleMarkComplete(activeVideo._id)}
                  disabled={completedVideos.includes(activeVideo._id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    completedVideos.includes(activeVideo._id)
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {completedVideos.includes(activeVideo._id) ? '✅ Completed' : 'Mark as Complete'}
                </button>
              )}
            </div>

            {/* Progress Bar (Student only) */}
            {user?.role === 'Student' && (
              <div className={`rounded-xl p-4 ${card} shadow`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">Course Progress</span>
                  <span className="text-sm font-bold text-blue-500">{completionPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                {isCourseComplete && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <span className="text-2xl">🏆</span>
                    <div className="flex-1">
                      <p className="font-bold text-yellow-700">Course Completed!</p>
                      <p className="text-sm text-yellow-600">Congratulations! Download your certificate below.</p>
                    </div>
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600"
                    >
                      🎓 Get Certificate
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Notes Section ── */}
            <div className={`rounded-xl shadow p-6 ${card}`}>
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 className="text-xl font-bold">📝 AI Notes & Summary</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {user?.role === 'Teacher' && (
                    <>
                      <button
                        onClick={handleGenerateNotes}
                        disabled={noteLoading}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-60 text-sm"
                      >
                        {noteLoading ? '⏳ Generating…' : '✨ Generate AI Summary'}
                      </button>
                      {notes && !isEditingMode && (
                        <button
                          onClick={() => setIsEditingMode(true)}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm"
                        >
                          ✏️ Edit Notes
                        </button>
                      )}
                      {isEditingMode && (
                        <>
                          <button onClick={handleSaveNotes} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 text-sm">💾 Save</button>
                          <button onClick={() => setIsEditingMode(false)} className="px-4 py-2 rounded-lg bg-gray-400 text-white font-semibold hover:bg-gray-500 text-sm">✖ Cancel</button>
                        </>
                      )}
                    </>
                  )}
                  {notes && (user?.role !== 'Student' || user?.isPremium) && (
                    <button
                      onClick={handleDownloadPDF}
                      className="btn-grad"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
                    >
                      ⬇ Download Notes (.docx)
                    </button>
                  )}
                </div>
              </div>

              {noteError && <p className="text-amber-500 text-sm mb-3 font-medium">{noteError}</p>}

              {/* Teacher edit textarea */}
              {user?.role === 'Teacher' && isEditingMode ? (
                <textarea
                  value={editingNotes}
                  onChange={e => setEditingNotes(e.target.value)}
                  rows={20}
                  className={`w-full border rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputCls}`}
                  placeholder="Write notes in Markdown. Use $..$ for inline math and $$...$$ for block math."
                />
              ) : (
                <div className={`notes-render-area rounded-lg p-6 min-h-[200px] border relative ${isDark ? 'bg-gray-700/60 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  {user?.role === 'Student' && !userIsPremium && notes ? (
                    <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-1)' }}>Premium Feature</h3>
                      <p style={{ margin: '0 0 1rem', color: 'var(--text-2)', fontSize: '0.9rem', maxWidth: 300, textAlign: 'center' }}>Upgrade to CoursePro Premium to access AI-generated notes and download DOCX summaries.</p>
                      <button onClick={() => alert('Please use the "Upgrade" button in the top navbar!')} className="btn-grad">Unlock AI Notes</button>
                    </div>
                  ) : null}
                  
                  <div style={{ filter: user?.role === 'Student' && !userIsPremium && notes ? 'blur(6px)' : 'none', opacity: user?.role === 'Student' && !userIsPremium && notes ? 0.4 : 1, userSelect: user?.role === 'Student' && !userIsPremium ? 'none' : 'auto' }}>
                    {notes ? (
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {notes}
                      </ReactMarkdown>
                    ) : (
                      !noteError && <p className="text-gray-400 italic">Notes not generated by teachers.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`rounded-xl p-12 text-center ${card}`}>
            <p className="text-gray-400">No videos found for this course.</p>
          </div>
        )}
      </div>

      {/* ── RIGHT: Sidebar ── */}
      <div className={`w-full md:w-1/4 rounded-xl shadow p-4 h-fit ${card}`}>
        <h3 className="font-bold text-lg mb-4">📚 Course Content</h3>
        <div className="space-y-2">
          {videos.map((vid, idx) => {
            const done = completedVideos.includes(vid._id);
            return (
              <button
                key={vid._id}
                onClick={() => setActiveVideo(vid)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  activeVideo?._id === vid._id
                    ? 'bg-blue-600 text-white font-semibold'
                    : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>{done ? '✅' : `${idx + 1}.`}</span>
                <span className="flex-1">{vid.title}</span>
              </button>
            );
          })}
        </div>

        {/* Subtitle info */}
        <div className={`mt-6 p-3 rounded-lg text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 text-blue-800'}`}>
          <strong>♿ Subtitles:</strong> For YouTube videos, click the <strong>CC</strong> button in the player. For local videos, captions auto-load if embedded.
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
