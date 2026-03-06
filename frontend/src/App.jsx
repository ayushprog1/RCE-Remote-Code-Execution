import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import our newly separated components!
import ProblemList from './pages/ProblemList';
import Workspace from './pages/Workspace';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';

function App() {
  const [questions, setQuestions] = useState([]);

  // Fetch the questions from MongoDB once when the app loads
  useEffect(() => {
    //fetch("http://localhost:3000/api/questions")
    fetch("https://rce-remote-code-execution.onrender.com/questions")
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error("API Error:", err));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProblemList questions={questions} />} />
        <Route path="/problem/:id" element={<Workspace questions={questions} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;