import React from 'react';

const CourseTimeline = ({ currentModule = 1 }) => {
    const modules = [
        { id: 1, title: 'Introduction to Python', completed: true, type: 'video' },
        { id: 2, title: 'Variables & Data Types', completed: true, type: 'video' },
        { id: 3, title: 'Control Flow (If/Else)', completed: false, type: 'video' },
        { id: 4, title: 'Loops & Iterations', completed: false, type: 'assignment' },
        { id: 5, title: 'Functions', completed: false, type: 'video' },
        { id: 6, title: 'Final Project', completed: false, type: 'project' }
    ];

    return (
        <div className="timeline-container" style={{ padding: '2rem', color: 'var(--text-main)' }}>
            <div className="badge">
                <span>🗺️</span> Learning Path
            </div>
            <h2 style={{ marginBottom: '2rem' }}>Python for Beginners</h2>

            <div className="timeline" style={{ position: 'relative', paddingLeft: '20px' }}>
                {/* Vertical Line */}
                <div style={{
                    position: 'absolute',
                    left: '29px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: 'var(--border)',
                    zIndex: 0
                }}></div>

                {modules.map((module, index) => (
                    <div key={module.id} className="timeline-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '2rem',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        {/* Circle Indicator */}
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: module.completed ? 'var(--success)' : (module.id === 3 ? 'var(--primary)' : 'var(--bg-card)'),
                            border: `2px solid ${module.completed ? 'var(--success)' : (module.id === 3 ? 'var(--primary)' : 'var(--text-secondary)')}`,
                            marginRight: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: module.id === 3 ? '0 0 10px var(--primary)' : 'none'
                        }}>
                            {module.completed && <span style={{ fontSize: '10px' }}>✓</span>}
                        </div>

                        {/* Content Card */}
                        <div style={{
                            flex: 1,
                            background: 'var(--bg-card)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            opacity: module.id > 3 ? 0.6 : 1
                        }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{module.title}</h4>
                                <small style={{ color: 'var(--text-secondary)' }}>{module.type.toUpperCase()}</small>
                            </div>
                            <button className="action-btn" disabled={module.id > 3} style={{
                                fontSize: '0.8rem',
                                padding: '0.4rem 0.8rem',
                                opacity: module.id > 3 ? 0.5 : 1
                            }}>
                                {module.completed ? 'Review' : 'Start'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseTimeline;
