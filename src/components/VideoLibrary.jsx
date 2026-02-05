import React, { useEffect, useState } from 'react';

const VideoLibrary = ({ onPlayVideo }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVideos = async () => {
        try {
            const res = await fetch('/api/videos');
            if (res.ok) {
                const data = await res.json();
                setVideos(data.videos || []);
            }
        } catch (err) {
            console.error("Failed to fetch videos", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    if (loading) return <div>Loading library...</div>;

    return (
        <div className="video-library">
            <div className="badge">
                <span>📚</span> Video Library
            </div>

            {videos.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                    No videos uploaded yet.
                </div>
            ) : (
                <div className="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {videos.map(video => (
                        <div
                            key={video.id}
                            className="video-card"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                                transition: 'var(--transition)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div className="video-thumbnail" style={{
                                height: '160px',
                                backgroundColor: video.thumbnail ? 'transparent' : '#2d2d2d',
                                backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {video.type === 'youtube' && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: '#ff0000',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                    }}>
                                        YOUTUBE
                                    </div>
                                )}
                                {!video.thumbnail && <div style={{ fontSize: '3rem' }}>▶️</div>}
                            </div>
                            <div className="video-info" style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>{video.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                    {new Date(video.upload_date).toLocaleDateString()}
                                </p>
                                <button
                                    className="extract-btn"
                                    onClick={() => onPlayVideo(video)}
                                    style={{ marginTop: 'auto', width: '100%' }}
                                >
                                    {video.type === 'youtube' ? 'Extract & Study 📝' : 'Watch Video 🎥'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VideoLibrary;
