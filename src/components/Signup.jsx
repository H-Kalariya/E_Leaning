import React, { useState } from 'react';

const Signup = ({ onLogin, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('Signup attempt:', { username, role });

        try {
            console.log('Sending POST to /api/auth/register...');
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));

            // Get the raw response text first
            const responseText = await response.text();
            console.log('Raw response:', responseText.substring(0, 200)); // Log first 200 chars

            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed data:', data);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.log('Full response text:', responseText);
                throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
            }

            if (response.ok) {
                onLogin(data.user);
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError(`Network error: ${err.message}. Check console for details.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-app)'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h1>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-group" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Username</label>
                        <input
                            type="text"
                            className="youtube-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            className="youtube-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>I am a:</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{
                                flex: 1,
                                padding: '0.8rem',
                                border: role === 'student' ? '1px solid var(--primary)' : '1px solid var(--border)',
                                background: role === 'student' ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                color: 'var(--text-main)',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    value="student"
                                    checked={role === 'student'}
                                    onChange={() => setRole('student')}
                                    style={{ display: 'none' }}
                                />
                                🎓 Student
                            </label>
                            <label style={{
                                flex: 1,
                                padding: '0.8rem',
                                border: role === 'teacher' ? '1px solid var(--primary)' : '1px solid var(--border)',
                                background: role === 'teacher' ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                color: 'var(--text-main)',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    value="teacher"
                                    checked={role === 'teacher'}
                                    onChange={() => setRole('teacher')}
                                    style={{ display: 'none' }}
                                />
                                👨‍🏫 Teacher
                            </label>
                        </div>
                    </div>

                    {error && <div className="error-message" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}

                    <button
                        type="submit"
                        className="extract-btn"
                        disabled={loading}
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchToLogin}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            padding: 0
                        }}
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
