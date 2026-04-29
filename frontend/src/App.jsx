import { useState } from 'react';
import { newsAPI } from './services/api';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert("Enter some news text");
      return;
    }

    try {
      setLoading(true);
      setResult(null); // reset previous result

      const res = await newsAPI.analyze({ text }); // ✅ JSON request

      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fa',
        padding: '40px',
        fontFamily: 'Arial',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: 'auto',
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ textAlign: 'center' }}>🧠 GeoTruth AI</h1>
        <p style={{ textAlign: 'center', color: '#555' }}>
          Detect fake / real news instantly
        </p>

        <textarea
          rows="5"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            marginTop: '20px',
          }}
          placeholder="Paste news text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: loading ? '#6c757d' : '#007bff',
            color: '#fff',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? "Analyzing..." : "Analyze News"}
        </button>

        {/* RESULT */}
        {result && (
          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              borderRadius: '10px',
              background:
                result.label === "REAL"
                  ? '#e6f4ea'
                  : result.label === "FAKE"
                  ? '#fdecea'
                  : '#fff4e5',
            }}
          >
            <h2>Result</h2>

            <p><strong>Label:</strong> {result.label}</p>
            <p><strong>Trust Score:</strong> {result.trust_score}%</p>
            <p>
              <strong>Confidence:</strong>{" "}
              {(result.confidence * 100).toFixed(2)}%
            </p>

            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              {result.label === "REAL" && "✅ Reliable News"}
              {result.label === "FAKE" && "❌ Fake News"}
              {result.label === "MISLEADING" && "⚠️ Misleading Content"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;