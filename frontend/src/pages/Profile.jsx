import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check if they are logged in by looking in the backpack
    const storedUser = localStorage.getItem('beatit_user');
    
    if (!storedUser) {
      navigate('/login'); // Kick them out if they aren't logged in!
      return;
    }

    const userObj = JSON.parse(storedUser);

    // 2. Fetch their shiny new profile data from the backend
    //fetch(`http://localhost:3000/api/users/${userObj.id}/profile`)
    // fetch(`https://rce-remote-code-execution.onrender.com/api/users/${userObj.id}/profile`)
    fetch(`http://65.2.38.13:3000/api/users/${userObj.id}/profile`)
      .then(res => res.json())
      .then(data => {
        setProfileData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch profile:", err);
        setIsLoading(false);
      });
  }, [navigate]);

  if (isLoading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;
  if (!profileData) return <div style={{ color: '#ff6b6b', padding: '40px', textAlign: 'center' }}>Error loading profile data.</div>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif', color: '#fff' }}>
      
      {/* HEADER SECTION */}
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>
          <span style={{ color: '#28a745' }}>Beat</span>IT Profile
        </h1>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back to Arena
        </button>
      </div>

      {/* STATS BANNER */}
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '40px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', marginBottom: '40px' }}>
        
        {/* Avatar Placeholder */}
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#28a745', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', fontWeight: 'bold', color: '#121212' }}>
          {profileData.user.username.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#fff' }}>{profileData.user.username}</h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '15px' }}>
            {profileData.user.role === 'admin' ? '🛡️ Platform Admin' : '🧑‍💻 Competitor'} • Joined {new Date(profileData.user.joinedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Big Stat Box */}
        <div style={{ textAlign: 'center', backgroundColor: '#252525', padding: '20px 40px', borderRadius: '8px', border: '1px solid #444' }}>
          <div style={{ fontSize: '48px', fontWeight: '900', color: '#28a745', lineHeight: '1' }}>
            {profileData.totalSolved}
          </div>
          <div style={{ color: '#aaa', fontSize: '14px', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Solved
          </div>
        </div>
      </div>

      {/* SOLVED QUESTIONS LIST */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px', color: '#ccc' }}>
          Conquered Problems
        </h3>

        {profileData.solvedDetails.length === 0 ? (
          <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '8px', textAlign: 'center', color: '#aaa', border: '1px dashed #444' }}>
            You haven't solved any problems yet. Time to get to work!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {profileData.solvedDetails.map((q) => (
              <div key={q.id} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#fff' }}>{q.title}</h4>
                  <span style={{ fontSize: '12px', color: '#007bff', backgroundColor: 'rgba(0, 123, 255, 0.1)', padding: '3px 8px', borderRadius: '12px' }}>
                    {q.category}
                  </span>
                </div>
                <button 
                  onClick={() => navigate(`/problem/${q.questionId}`)}
                  style={{ padding: '8px 15px', backgroundColor: 'transparent', color: '#28a745', border: '1px solid #28a745', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Review Code
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}