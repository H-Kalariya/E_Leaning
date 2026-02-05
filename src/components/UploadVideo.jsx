import React, { useState } from 'react';

const UploadVideo = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/videos/upload'); // Proxy handles /api domain

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setUploading(false);
                    setFile(null);
                    setTitle('');
                    if (onUploadSuccess) onUploadSuccess();
                    alert('Video uploaded successfully!');
                } else {
                    setError('Upload failed: ' + xhr.responseText);
                    setUploading(false);
                }
            };

            xhr.onerror = () => {
                setError('Upload failed due to network error');
                setUploading(false);
            };

            xhr.send(formData);
        } catch (err) {
            setError(err.message);
            setUploading(false);
        }
    };

    return (
        <div className="input-section">
            <div className="badge">
                <span>📹</span> Upload New Video
            </div>

            <div className="upload-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="file-upload">
                    <label className="file-label" style={{ padding: '2rem' }}>
                        {file ? `Selected: ${file.name}` : 'Click to Select Video File'}
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="file-input"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {file && (
                    <input
                        type="text"
                        className="youtube-input"
                        placeholder="Video Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={uploading}
                    />
                )}

                {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}

                {uploading && (
                    <div className="progress-bar-container" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                        <div
                            className="progress-bar"
                            style={{ width: `${progress}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.2s' }}
                        />
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="extract-btn"
                >
                    {uploading ? `Uploading ${Math.round(progress)}%...` : 'Upload Video'}
                </button>
            </div>
        </div>
    );
};

export default UploadVideo;
