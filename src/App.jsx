import React, { useState } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [mode, setMode] = useState('youtube') // 'youtube' or 'audio'
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [savedNotes, setSavedNotes] = useState([])

  // Edit vs Preview mode
  const [isEditing, setIsEditing] = useState(false)

  // Fetch saved notes on mount
  React.useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        setSavedNotes(data.notes || [])
      }
    } catch (err) {
      console.error('Error fetching notes:', err)
    }
  }

  const saveToLibrary = async () => {
    if (!summary) return

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: summary })
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
      const response = await fetch(`/api/notes/${filename}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.content)
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

    const formData = new FormData()
    formData.append('audio', file)

    try {
      const response = await fetch('/api/transcribe-audio', {
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

      const response = await fetch('/api/summarize', {
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
      setIsEditing(false) // Auto switch to preview mode when summary is ready
      console.log('Summary generated and set to Preview mode')
    } catch (err) {
      console.error('Summary error:', err)
      setError('Failed to generate summary: ' + err.message)
    } finally {
      setLoadingSummary(false)
    }
  }

  const downloadSummary = () => {
    if (!summary) return

    const blob = new Blob([summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lecture_summary.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const extractTranscript = async () => {
    if (!youtubeUrl) {
      setError('Please enter a YouTube URL')
      return
    }

    setLoading(true)
    setError(null)
    setTranscripts([])

    try {
      console.log('Sending request to:', '/api/transcript')
      console.log('Request body:', JSON.stringify({ url: youtubeUrl }))

      const response = await fetch('/api/transcript', {
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
        <h2>📚 Saved Notes</h2>
        <div className="notes-list">
          {savedNotes.length === 0 && (
            <div className="empty-notes">No saved notes yet.</div>
          )}
          {savedNotes.map((note) => (
            <div
              key={note.filename}
              className="note-item"
              onClick={() => loadNote(note.filename)}
            >
              <div className="note-title">{note.title || 'Untitled Note'}</div>
              <div className="note-date">
                {new Date(note.created_at * 1000).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="card">
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
                <div className="divider"></div>
                <h3>AI Lecture Summary</h3>

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
                    {loadingSummary ? 'Generating Summary...' : '✨ Generate Detailed Summary'}
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
                      <button type="button" onClick={downloadSummary} className="action-btn download">
                        💾 Download Note
                      </button>
                      <button type="button" onClick={() => setSummary(null)} className="action-btn clear">
                        ❌ Clear
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="summary-editor"
                        rows={20}
                        placeholder="Summary will appear here..."
                      />
                    ) : (
                      <div className="summary-preview">
                        <ReactMarkdown
                          children={String(summary || '')
                            .replace(/\\\(/g, ' $ ')
                            .replace(/\\\)/g, ' $ ')
                            .replace(/\\\[/g, ' $$ ')
                            .replace(/\\\]/g, ' $$ ')
                            .replace(/\((?=\s*\\sqrt)/g, '$')  // Handle ( \sqrt ) if it happens
                            .replace(/\\sqrt(.*?)\)/g, '\\sqrt$1$') // Close it
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
