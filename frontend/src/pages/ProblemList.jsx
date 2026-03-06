import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProblemList({ questions }) {
  const navigate = useNavigate();

  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState(null);

  // Check the browser's backpack for a logged-in user when the page loads!
  useEffect(() => {
    const storedUser = localStorage.getItem('beatit_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    // Empty the backpack!
    localStorage.removeItem('beatit_token');
    localStorage.removeItem('beatit_user');
    setUser(null);
  };

  // --- SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Arrays', 'Math', 'Strings', 'Sorting', 'Dynamic Programming', 'Graphs', 'Trees'];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>

      {/* 1. THE DYNAMIC HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333'
      }}>
        {/* Logo */}
        <h1 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: '900', letterSpacing: '1px' }}>
          <span style={{ color: '#28a745' }}>Beat</span>IT
        </h1>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '300px', padding: '10px 20px', borderRadius: '20px', border: '1px solid #444',
            backgroundColor: '#2d2d2d', color: '#fff', fontSize: '16px', outline: 'none'
          }}
        />

        {/* AUTHENTICATION UI */}
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ color: '#aaa', fontSize: '16px' }}>
                Welcome, <strong style={{ color: '#fff' }}>{user.username}</strong>
              </span>
              
              {/* Secret Admin Button! */}
              {user.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')}
                  style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Admin Panel
                </button>
              )}


              <button 
                onClick={() => navigate('/profile')}
                style={{ padding: '8px 15px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#555'} onMouseOut={(e) => e.target.style.backgroundColor = '#444'}
              >
                Profile
              </button>
              
              <button 
                onClick={handleLogout}
                style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              style={{ padding: '10px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* 2. THE CATEGORY SCROLLBAR */}
      <div style={{
        padding: '20px 40px', borderBottom: '1px solid #333', backgroundColor: '#1e1e1e',
        display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', gap: '15px', scrollbarWidth: 'none' 
      }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
              border: selectedCategory === category ? 'none' : '1px solid #444',
              backgroundColor: selectedCategory === category ? '#fff' : '#2d2d2d',
              color: selectedCategory === category ? '#000' : '#aaa', transition: 'all 0.2s'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 3. THE QUESTION LIST */}
      <main style={{ padding: '40px', flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1000px' }}>

          <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
            {filteredQuestions.length === 0 ? (
              <p style={{ padding: '30px', textAlign: 'center', color: '#aaa', fontSize: '18px' }}>No questions found matching your search.</p>
            ) : null}

            {filteredQuestions.map((q, index) => (
              <div
                key={q.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '25px', borderBottom: index !== filteredQuestions.length - 1 ? '1px solid #333' : 'none',
                  backgroundColor: index % 2 === 0 ? '#252525' : '#1e1e1e',
                }}
              >
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '8px' }}>
                    {q.title}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#007bff', backgroundColor: 'rgba(0, 123, 255, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                      {q.category}
                    </span>
                    <span style={{ fontSize: '13px', color: '#aaa', backgroundColor: '#333', padding: '4px 10px', borderRadius: '12px' }}>
                      ✅ {q.successfulSubmissions} Submissions
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  
                  {/* IF the user exists AND their solved list includes this question ID, show the badge! */}
                  {user && user.solvedQuestions && user.solvedQuestions.includes(q.id) && (
                    <span style={{ color: '#28a745', fontSize: '14px', fontWeight: 'bold' }}>
                      ✅ Solved
                    </span>
                  )}

                  <button
                    onClick={() => navigate(`/problem/${q.id}`)}
                    style={{
                      padding: '12px 25px', backgroundColor: '#28a745', color: 'white',
                      border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                  >
                    Solve Problem
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </main>

    </div>
  );
}