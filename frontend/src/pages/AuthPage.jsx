import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const navigate = useNavigate();
  
  // Toggle between Login and Register modes
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Decide which backend route to hit based on the toggle state
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // SUCCESS! Save the VIP wristband in the browser's backpack
        localStorage.setItem('beatit_token', data.token);
        localStorage.setItem('beatit_user', JSON.stringify({
          id: data._id,
          username: data.username,
          role: data.role,
          solvedQuestions: data.solvedQuestions || []
        }));

        // Send the user to the homepage
        navigate('/');
      } else {
        // Show the error from the backend (e.g., "Invalid password")
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
      
      <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '10px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        
        <h1 style={{ margin: '0 0 20px 0', color: '#fff', textAlign: 'center', fontSize: '32px', fontWeight: '900', letterSpacing: '1px' }}>
          <span style={{ color: '#28a745' }}>Beat</span>IT
        </h1>
        
        <h2 style={{ color: '#ccc', textAlign: 'center', marginBottom: '30px', fontSize: '18px' }}>
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        {error && (
          <div style={{ backgroundColor: '#dc354522', border: '1px solid #dc3545', color: '#ff6b6b', padding: '10px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Only show Username field if they are Registering */}
          {!isLogin && (
            <div>
              <label style={{ display: 'block', color: '#aaa', marginBottom: '5px', fontSize: '14px' }}>Username</label>
              <input 
                type="text" name="username" required={!isLogin} value={formData.username} onChange={handleChange}
                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff', outline: 'none' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: '#aaa', marginBottom: '5px', fontSize: '14px' }}>Email</label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#aaa', marginBottom: '5px', fontSize: '14px' }}>Password</label>
            <input 
              type="password" name="password" required value={formData.password} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            style={{ width: '100%', padding: '14px', marginTop: '10px', backgroundColor: isLoading ? '#555' : '#28a745', color: '#fff', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '5px', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            style={{ color: '#28a745', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </div>

      </div>
    </div>
  );
}