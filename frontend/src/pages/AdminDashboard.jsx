import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    questionId: '',
    title: '',
    description: '',
    category: 'Uncategorized',
    timeLimit: '2.0 Seconds',
    memoryLimit: '256 MB',
    starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}'
  });
  
  // Dynamic Test Cases State
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);

  // Fetch existing questions on load
  const fetchQuestions = () => {
    //fetch("http://localhost:3000/api/questions")
    // fetch("https://rce-remote-code-execution.onrender.com/api/questions")
    fetch("http://65.2.38.13:3000/api/questions")
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handle basic input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle dynamic test case changes
  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const addTestCase = () => setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  const removeTestCase = (index) => setTestCases(testCases.filter((_, i) => i !== index));

  // Submit the new question to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, testCases };

    try {
      // const response = await fetch("http://localhost:3000/api/admin/questions", {
      // const response = await fetch("https://rce-remote-code-execution.onrender.com/api/admin/questions", {
      const response = await fetch("http://65.2.38.13:3000/api/admin/questions", {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Question successfully added!");
        fetchQuestions(); // Refresh the list
        // Reset form
        setFormData({ ...formData, questionId: '', title: '', description: '' });
        setTestCases([{ input: '', expectedOutput: '' }]);
      } else {
        const errorData = await response.json();
        alert("Error: " + errorData.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server.");
    }
  };

  // Delete a question
  const handleDelete = async (questionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this question?")) return;

    try {
      //const response = await fetch(`http://localhost:3000/api/admin/questions/${questionId}`, {
      // const response = await fetch(`https://rce-remote-code-execution.onrender.com/api/admin/questions/${questionId}`,{
      const response = await fetch(`http://65.2.38.13:3000/api/admin/questions/${questionId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchQuestions(); // Refresh the list after deleting
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#fff', padding: '40px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Back to Site
        </button>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        
        {/* LEFT PANE: Create New Question Form */}
        <div style={{ flex: '1', backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '8px', border: '1px solid #333' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#28a745' }}>Add New Question</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Question ID (Unique, e.g., 'q3')</label>
                <input required name="questionId" value={formData.questionId} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }} />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Title</label>
                <input required name="title" value={formData.title} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}>
                <option>Arrays</option>
                <option>Math</option>
                <option>Strings</option>
                <option>Sorting</option>
                <option>Dynamic Programming</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Description</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="4" style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px', resize: 'vertical' }} />
            </div>

            {/* TEST CASES SECTION */}
            <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
              <h3 style={{ marginTop: 0, color: '#ccc' }}>Hidden Test Cases</h3>
              {testCases.map((tc, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  <textarea placeholder={`Input ${index + 1}`} required value={tc.input} onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)} rows="2" style={{ flex: 1, backgroundColor: '#111', color: '#fff', border: '1px solid #555', padding: '8px' }} />
                  <textarea placeholder={`Expected Output ${index + 1}`} required value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)} rows="2" style={{ flex: 1, backgroundColor: '#111', color: '#fff', border: '1px solid #555', padding: '8px' }} />
                  {testCases.length > 1 && (
                    <button type="button" onClick={() => removeTestCase(index)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>X</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTestCase} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Test Case</button>
            </div>

            <button type="submit" style={{ padding: '15px', backgroundColor: '#28a745', color: '#fff', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
              Publish Question
            </button>
          </form>
        </div>

        {/* RIGHT PANE: Existing Questions List */}
        <div style={{ flex: '0 0 400px', backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '8px', border: '1px solid #333' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>Manage Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {questions.map(q => (
              <div key={q.id} style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ display: 'block' }}>{q.title}</strong>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>ID: {q.id} | {q.category}</span>
                </div>
                <button onClick={() => handleDelete(q.id)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            ))}
            {questions.length === 0 && <p style={{ color: '#aaa' }}>No questions in database.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}