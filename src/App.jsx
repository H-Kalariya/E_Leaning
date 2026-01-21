import React, { useState } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

// IMPORTANT: Set this to your live backend URL after deploying (e.g., https://your-backend.onrender.com)
// If empty, it uses the same domain as the frontend (works for local dev proxy)
const API_BASE = import.meta.env.VITE_API_URL || '';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [backendStatus, setBackendStatus] = useState('checking') // 'checking', 'online', 'offline'

  const [mode, setMode] = useState('youtube') // 'youtube' or 'audio'
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [savedNotes, setSavedNotes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Edit vs Preview mode
  const [isEditing, setIsEditing] = useState(false)
  const [currentFilename, setCurrentFilename] = useState(null)
  const [noteTitle, setNoteTitle] = useState('')

  // Fetch saved notes and check backend on mount
  React.useEffect(() => {
    checkBackend()
    fetchNotes()
  }, [])

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health`)
      if (response.ok) {
        const data = await response.json()
        if (data.groq_key === false) {
          setBackendStatus('key-missing')
        } else {
          setBackendStatus('online')
        }
      } else {
        setBackendStatus('offline')
      }
    } catch (err) {
      setBackendStatus('offline')
    }
  }

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notes`)
      if (response.ok) {
        const data = await response.json()
        setSavedNotes(data.notes || [])
      }
    } catch (err) {
      console.error('Error fetching notes:', err)
    }
  }

  const deleteNote = async (filename, e) => {
    if (e) e.stopPropagation()
    console.log('🗑️ Attempting to delete note:', filename)
    if (!window.confirm(`Are you sure you want to delete "${filename}" ? `)) return

    try {
      const response = await fetch(`${API_BASE}/api/notes/${filename}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      })

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.warn('Received non-JSON response:', text)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      console.log('Delete response:', data)

      if (response.ok) {
        console.log('✅ Note deleted successfully')
        fetchNotes() // Refresh sidebar
        if (currentFilename === filename) {
          setSummary(null)
          setNoteTitle('')
          setCurrentFilename(null)
        }
      } else {
        throw new Error(data.error || 'Failed to delete note')
      }
    } catch (err) {
      console.error('Error deleting note:', err)
      alert('Failed to delete note: ' + err.message)
    }
  }

  const filteredNotes = savedNotes.filter(note =>
    (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const saveToLibrary = async () => {
    if (!summary) return

    try {
      const response = await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: summary,
          filename: currentFilename
        })
      })

      if (response.ok) {
        // Refresh list
        fetchNotes()
        alert('Note saved to library!')
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      console.error('Error saving note:', err)
      alert('Failed to save note')
    }
  }

  const loadNote = async (filename) => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/${filename}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.content)
        setNoteTitle(filename.replace('.txt', '').replace(/_/g, ' '))
        setCurrentFilename(filename)
        setIsEditing(false)
      }
    } catch (err) {
      console.error('Error loading note:', err)
    }
  }

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = React.useRef(null)
  const chunksRef = React.useRef([])
  const timerRef = React.useRef(null)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    await uploadAndTranscribe(file)
  }

  // Handle audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
        uploadAndTranscribe(file)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      setError(null)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const uploadAndTranscribe = async (file) => {
    setLoading(true)
    setError(null)
    setTranscripts([])
    setSummary(null)
    setNoteTitle('')
    setCurrentFilename(null)

    const formData = new FormData()
    formData.append('audio', file)

    try {
      const response = await fetch(`${API_BASE}/api/transcribe-audio`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to transcribe audio')
      }

      const data = await response.json()

      // Aggregate if multiple segments returned (though typically Whisper returns segments)
      // We'll flatten it to one block if desired, or show segments.
      // For consistency with YouTube "no time line" request, let's aggregate.
      if (data.transcripts) {
        setTranscripts(data.transcripts)
      } else if (data.text) {
        setTranscripts([{ text: data.text }])
      }
    } catch (err) {
      console.error('Transcription error:', err)
      setError(err.message || 'Failed to transcribe audio')
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async () => {
    if (transcripts.length === 0) return

    setLoadingSummary(true)
    setError(null)

    try {
      // Aggregate transcript if needed (it's already aggregated in backend but just in case)
      const fullText = transcripts.map(t => t.text).join(' ')

      const response = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: fullText }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
      if (data.title) {
        setNoteTitle(data.title)
      }
      setIsEditing(false) // Auto switch to preview mode when summary is ready
      console.log('Summary generated and set to Preview mode')
    } catch (err) {
      console.error('Summary error:', err)
      setError('Failed to generate summary: ' + err.message)
    } finally {
      setLoadingSummary(false)
    }
  }

  const exportToWord = async () => {
    if (!summary) return;

    try {
      const response = await fetch(`${API_BASE}/api/export-docx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: summary,
          title: noteTitle || (currentFilename ? currentFilename.replace('.txt', '') : 'lecture_summary')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export Word document');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = noteTitle ? `${noteTitle.replace(/\s+/g, '_')}.docx` : (currentFilename ? currentFilename.replace('.txt', '.docx') : 'lecture_summary.docx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Word export error:', err);
      alert('Failed to export Word document: ' + err.message);
    }
  };

  const extractTranscript = async () => {
    if (!youtubeUrl) {
      setError('Please enter a YouTube URL')
      return
    }

    setLoading(true)
    setError(null)
    setTranscripts([])
    setSummary(null)
    setNoteTitle('')
    setCurrentFilename(null)

    try {
      console.log('Sending request to:', '/api/transcript')
      console.log('Request body:', JSON.stringify({ url: youtubeUrl }))

      const response = await fetch(`${API_BASE}/api/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      // Check if response is ok and has content
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to fetch transcript'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || `Server returned ${response.status}`
        }
        throw new Error(errorMessage)
      }

      // Check if response has content before parsing
      const text = await response.text()
      console.log('Raw response text:', text)

      if (!text || text.trim() === '') {
        throw new Error('Empty response from server. Make sure the backend server is running on port 3001.')
      }

      let data
      try {
        data = JSON.parse(text)
        console.log('Parsed data:', data)
      } catch (parseError) {
        console.error('Parse error:', parseError)
        throw new Error('Invalid response from server. Make sure the backend server is running on port 3001.')
      }

      console.log('Setting transcripts:', data.transcripts)
      setTranscripts(data.transcripts || [])

      // Show message if no transcripts found
      if (data.message && (!data.transcripts || data.transcripts.length === 0)) {
        setError(data.message)
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the transcript')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>📚 Saved Notes</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="notes-list">
          {filteredNotes.length === 0 && (
            <div className="empty-notes">
              {searchQuery ? 'No notes match your search.' : 'No saved notes yet.'}
            </div>
          )}
          {filteredNotes.map((note) => (
            <div
              key={note.filename}
              className={`note-item ${currentFilename === note.filename ? 'active' : ''}`}
              onClick={() => loadNote(note.filename)}
            >
              <div className="note-info">
                <div className="note-title">{note.title || 'Untitled Note'}</div>
                <div className="note-date">
                  {new Date(note.created_at * 1000).toLocaleDateString()}
                </div>
              </div>
              <button
                className="delete-note-btn"
                onClick={(e) => deleteNote(note.filename, e)}
                title="Delete note"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="card">
          <div className="status-badge-container">
            <span className={`status-badge ${backendStatus}`} title={backendStatus === 'key-missing' ? 'Groq API Key (GROQ_API_KEY) is missing in .env file' : ''}>
              {backendStatus === 'online' ? '● Backend Online' :
                backendStatus === 'offline' ? '○ Backend Offline' :
                  backendStatus === 'key-missing' ? '⚠ Groq Key Missing' :
                    '... Checking Backend'}
            </span>
          </div>
          <h1>Transcript Extractor</h1>

          <div className="tabs">
            <button
              className={`tab ${mode === 'youtube' ? 'active' : ''}`}
              onClick={() => setMode('youtube')}
            >
              📺 YouTube URL
            </button>
            <button
              className={`tab ${mode === 'audio' ? 'active' : ''}`}
              onClick={() => setMode('audio')}
            >
              🎙️ Audio File / Mic
            </button>
          </div>

          {mode === 'youtube' ? (
            <div className="input-section">
              <div className="badge">
                <span>📹</span> Extract full transcript from YouTube
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter YouTube video URL..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && extractTranscript()}
                  className="youtube-input"
                />
                <button
                  onClick={extractTranscript}
                  disabled={loading}
                  className="extract-btn"
                >
                  {loading ? 'Extracting...' : 'Extract Transcript'}
                </button>
              </div>
            </div>
          ) : (
            <div className="input-section">
              <div className="badge">
                <span>🎤</span> Upload audio or record voice
              </div>

              <div className="audio-controls">
                <div className="file-upload">
                  <label className="file-label">
                    📁 Upload Audio File
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="file-input"
                      disabled={loading || isRecording}
                    />
                  </label>
                </div>

                <div className="divider">OR</div>

                <div className="recording-controls">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={loading}
                      className="record-btn start"
                    >
                      🔴 Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="record-btn stop"
                    >
                      ⏹️ Stop Recording ({formatTime(recordingTime)})
                    </button>
                  )}
                </div>
              </div>

              {loading && (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Transcribing audio... (this may take a moment)</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {transcripts.length > 0 && (
            <div className="transcript-section">
              <h2>Transcript Result</h2>
              <div className="transcript-list">
                {transcripts.map((segment, index) => (
                  <div key={index} className="transcript-item">
                    <div className="segment-text">{segment.text}</div>
                  </div>
                ))}
              </div>

              <div className="summary-section">
                <div className="note-header">
                  {isEditing ? (
                    <input
                      type="text"
                      className="note-title-input"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note Title"
                    />
                  ) : (
                    <h3>{noteTitle || 'AI Lecture Summary'}</h3>
                  )}
                </div>

                {summary === null ? (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Generate Summary button clicked');
                      generateSummary();
                    }}
                    disabled={loadingSummary}
                    className="extract-btn summary-btn"
                  >
                    {loadingSummary ? 'Generating Summary...' : '✨ Generate Detailed Note with Formulae'}
                  </button>
                ) : (
                  <div className="summary-container">
                    <div className="summary-actions">
                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className="action-btn preview-toggle"
                      >
                        {isEditing ? '👁️ Preview' : '✏️ Edit'}
                      </button>
                      <button type="button" onClick={saveToLibrary} className="action-btn save-lib">
                        📚 Save to Library
                      </button>
                      <button type="button" onClick={exportToWord} className="action-btn export-word">
                        📝 Export to Word
                      </button>
                      <button type="button" onClick={() => { setSummary(null); setNoteTitle(''); setCurrentFilename(null); }} className="action-btn clear">
                        ❌ Clear
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="editor-wrapper">
                        <div className="editor-toolbar">
                          <button onClick={() => setSummary(prev => prev + ' \\(  \\)')} title="Math Expression Small">\( x \)</button>
                          <button onClick={() => setSummary(prev => prev + ' \\( \\sqrt{x} \\)')} title="Square Root">√</button>
                          <button onClick={() => setSummary(prev => prev + ' \\( x^2 \\)')} title="Square">x²</button>
                          <button onClick={() => setSummary(prev => prev + ' \\( \\int_{a}^{b} f(x) dx \\)')} title="Integral">∫</button>
                          <button onClick={() => setSummary(prev => prev + ' \\( \\sum_{n=1}^{\\infty} \\)')} title="Sum">∑</button>
                          <button onClick={() => setSummary(prev => prev + ' \\( \\psi \\)')} title="Psi">ψ</button>
                          <button onClick={() => setSummary(prev => prev + ' \\( \\hbar \\)')} title="hbar">ℏ</button>
                          <span className="toolbar-hint">Hint: Use \( formula \) for scientific symbols</span>
                        </div>
                        <textarea
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          className="summary-editor"
                          rows={20}
                          placeholder="Summary will appear here..."
                        />
                      </div>
                    ) : (
                      <div className="summary-preview">
                        <ReactMarkdown
                          children={String(summary || '')
                            // Use more robust replacements for math delimiters
                            .replace(/\\\[([\s\S]*?)\\\]/g, (_, match) => `$$${match.trim()}$$`)
                            .replace(/\\\(([\s\S]*?)\\\)/g, (_, match) => `$${match.trim()}$`)
                          }
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
