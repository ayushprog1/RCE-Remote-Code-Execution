import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react'; // <-- THE MAGIC EDITOR

const socket = io("http://localhost:3000");

export default function Workspace({ questions }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const question = questions.find(q => q.id === id);

  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [verdict, setVerdict] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // --- NEW: STOPWATCH STATE ---
  const [time, setTime] = useState(0); // Time in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Stopwatch ticking logic
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval); // Cleanup on unmount
  }, [isTimerRunning]);

  // Format seconds into HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- LOAD QUESTION DATA ---
  useEffect(() => {
    if (question) {
      setCode(question.starterCode);
      setCustomInput(question.sampleInput);
      setOutput('');
      setVerdict('');
      setTime(0); // Reset timer when loading a new question
      setIsTimerRunning(true);
    }
  }, [question]);

  // --- SOCKET EVENT LISTENER ---
  useEffect(() => {
    socket.on("execution_result", (data) => {
      setIsExecuting(false);
      setOutput(data.output);
      setVerdict(data.verdict);

      // Stop the timer if they get the right answer!
      if (data.verdict === 'Accepted') {
        setIsTimerRunning(false); 
      }

      // Update Local Backpack for the Solved Badge
      if (data.verdict === 'Accepted') {
        const storedUser = JSON.parse(localStorage.getItem('beatit_user'));
        if (storedUser) {
          if (!storedUser.solvedQuestions.includes(data.questionId)) {
             storedUser.solvedQuestions.push(data.questionId);
             localStorage.setItem('beatit_user', JSON.stringify(storedUser));
          }
        }
      }
    });
    return () => socket.off("execution_result");
  }, []);

  const handleSubmit = () => {
    setIsExecuting(true);
    setOutput("Executing...");
    setVerdict("Grading in progress...");

    const storedUser = JSON.parse(localStorage.getItem('beatit_user'));
    
    socket.emit("submit_code", { 
      questionId: id, 
      language: "cpp", 
      code, 
      customInput,
      userId: storedUser ? storedUser.id : null 
    });
  };

  if (!question) return <div style={{ padding: '40px', color: 'white' }}>Loading Workspace...</div>;

  let verdictColor = '#ccc';
  if (verdict === 'Accepted') verdictColor = '#28a745';
  if (verdict === 'Wrong Answer') verdictColor = '#dc3545';
  if (verdict.includes('Error')) verdictColor = '#ffc107';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#121212' }}>

      {/* LEFT PANE: Editor & Testcases */}
      <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', padding: '20px', borderRight: '2px solid #333' }}>
        
        {/* TOP HEADER & TIMER BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate('/')} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', marginRight: '20px', transition: 'background 0.2s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#444'} onMouseOut={(e) => e.target.style.backgroundColor = '#333'}>
              ← Back
            </button>
            <h3 style={{ margin: 0, color: '#ccc', fontWeight: '600' }}>C++ Workspace</h3>
          </div>

          {/* THE AESTHETIC STOPWATCH UI */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            
            {/* Time Display with Glowing Status Dot */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 15px', borderRight: '1px solid #333', backgroundColor: '#252525' }}>
              <div style={{ 
                width: '8px', height: '8px', borderRadius: '50%', marginRight: '10px',
                backgroundColor: isTimerRunning ? '#28a745' : '#dc3545',
                boxShadow: isTimerRunning ? '0 0 8px #28a745' : 'none',
                transition: 'all 0.3s ease'
              }} />
              <span style={{ fontSize: '15px', fontFamily: '"Fira Code", "JetBrains Mono", monospace', color: '#eee', letterSpacing: '1px', fontWeight: '500' }}>
                {formatTime(time)}
              </span>
            </div>

            {/* Sleek Text Controls */}
            <div style={{ display: 'flex' }}>
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)} 
                style={{ padding: '8px 15px', background: 'none', border: 'none', borderRight: '1px solid #333', color: '#aaa', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px', transition: 'color 0.2s, background 0.2s' }}
                onMouseOver={(e) => { e.target.style.color = '#fff'; e.target.style.backgroundColor = '#2a2a2a'; }}
                onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.backgroundColor = 'transparent'; }}
              >
                {isTimerRunning ? 'PAUSE' : 'RESUME'}
              </button>
              <button 
                onClick={() => { setTime(0); setIsTimerRunning(false); }} 
                style={{ padding: '8px 15px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px', transition: 'color 0.2s, background 0.2s' }}
                onMouseOver={(e) => { e.target.style.color = '#fff'; e.target.style.backgroundColor = '#2a2a2a'; }}
                onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.backgroundColor = 'transparent'; }}
              >
                RESET
              </button>
            </div>
          </div>

        </div>

        {/* --- THE MONACO EDITOR --- */}
        <div style={{ flex: '1', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden' }}>
          <Editor
            height="100%"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
            options={{
              fontSize: 16,
              minimap: { enabled: false }, // Hides the annoying mini-map on the right
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 15 }
            }}
          />
        </div>

        <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {verdict && (
            <div style={{ marginRight: '20px', fontSize: '18px', fontWeight: 'bold', color: verdictColor }}>
              Status: {verdict}
            </div>
          )}
          <button
            onClick={handleSubmit} disabled={isExecuting}
            style={{ padding: '12px 35px', fontSize: '16px', fontWeight: 'bold', cursor: isExecuting ? 'not-allowed' : 'pointer', backgroundColor: isExecuting ? '#555' : '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            {isExecuting ? "Executing..." : "Submit Solution"}
          </button>
        </div>

        {/* TESTCASES & OUTPUT */}
        <div style={{ display: 'flex', gap: '20px', height: '200px' }}>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#ccc', fontSize: '14px' }}>Custom Input</h3>
            <textarea
              value={customInput} onChange={(e) => setCustomInput(e.target.value)} spellCheck="false"
              style={{ flex: '1', backgroundColor: '#000', color: '#fff', padding: '15px', border: '1px solid #333', borderRadius: '8px', fontFamily: 'monospace', resize: 'none', outline: 'none' }}
            />
          </div>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#ccc', fontSize: '14px' }}>Raw Output / Errors</h3>
            <pre style={{ flex: '1', backgroundColor: '#000', color: '#fff', padding: '15px', border: '1px solid #333', borderRadius: '8px', fontFamily: 'monospace', overflowY: 'auto', margin: 0 }}>
              {output}
            </pre>
          </div>
        </div>

      </div>

      {/* RIGHT PANE: Description, Examples, & Constraints */}
      <div style={{ flex: '1', padding: '30px', overflowY: 'auto', backgroundColor: '#1a1a1a' }}>
        <h2 style={{ marginTop: 0, fontSize: '28px', borderBottom: '1px solid #333', paddingBottom: '15px', color: '#fff' }}>{question.title}</h2>

        <div style={{ marginTop: '20px', marginBottom: '30px' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', color: '#ddd', fontSize: '18px', lineHeight: '1.6' }}>
            {question.description}
          </pre>
        </div>

        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Example 1:</h3>
        <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #007bff', marginBottom: '30px' }}>
          <p style={{ margin: '0 0 10px 0', fontFamily: 'monospace', color: '#aaa' }}>
            <strong style={{ color: '#fff' }}>Input:</strong><br />
            {question.sampleInput}
          </p>
          <p style={{ margin: 0, fontFamily: 'monospace', color: '#aaa' }}>
            <strong style={{ color: '#fff' }}>Expected Output:</strong><br />
            {question.sampleExpectedOutput}
          </p>
        </div>

        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Constraints:</h3>
        <ul style={{ color: '#aaa', backgroundColor: '#2d2d2d', padding: '15px 15px 15px 35px', borderRadius: '8px', fontFamily: 'monospace' }}>
          <li style={{ marginBottom: '8px' }}>Time Limit: <strong style={{ color: '#fff' }}>{question.timeLimit}</strong></li>
          <li>Memory Limit (RAM): <strong style={{ color: '#fff' }}>{question.memoryLimit}</strong></li>
        </ul>
      </div>

    </div>
  );
}