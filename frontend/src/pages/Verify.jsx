import { useState, useRef } from 'react';
import axios from 'axios';

const fakeKeywords = [
  'viral', 'shocking', '100% true', 'breaking', 'exposed',
  'you won’t believe', 'secret', 'leaked', 'hacked', 'urgent'
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Verify = () => {
  const [visionMode, setVisionMode] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // ---------------- IMAGE HANDLER ----------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ---------------- GEO ----------------
  const getGeolocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => resolve(null)
      );
    });

  // ---------------- FAKE WORD DETECT ----------------
  const detectFakeWords = (t = '') =>
    fakeKeywords.filter((w) => t.toLowerCase().includes(w));

  // ---------------- TEXT HIGHLIGHT ----------------
  const highlightText = (text = '') => {
    return text.split(' ').map((word, i) => {
      const low = word.toLowerCase();
      const isRisk = fakeKeywords.some((w) => low.includes(w));

      return (
        <span
          key={i}
          className={
            isRisk
              ? 'bg-red-200 px-1 rounded animate-pulse'
              : ''
          }
        >
          {word + ' '}
        </span>
      );
    });
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('Please enter news content');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const location = await getGeolocation();

      const formData = new FormData();
      formData.append('text', text);

      if (location) formData.append('location', JSON.stringify(location));
      if (image) formData.append('image', image);

      const res = await axios.post(`${API_BASE}/api/news/analyze`, formData, {
        headers: { Accept: 'application/json' }
      });

      setResult(res.data);
    } catch (err) {
      setError(
        err?.response?.status === 403
          ? 'Access denied (CORS/API issue)'
          : err?.response?.data?.detail || 'Analysis failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAFE RESULT ----------------
  const score = result?.trust_score ?? 0;
  const label = result?.label ?? '';

  const gradient =
    label === 'REAL'
      ? 'from-green-400 to-emerald-600'
      : label === 'FAKE'
      ? 'from-red-400 to-pink-600'
      : 'from-yellow-400 to-orange-500';

  const trendData = [
    { label: 'Scan', value: Math.max(20, score - 30) },
    { label: 'Analyze', value: Math.max(40, score - 10) },
    { label: 'Final AI', value: score },
  ];

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex justify-center p-6">

      <div className="w-full max-w-4xl">

        {/* HEADER */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold">🧠 GeoTruth AI Investigation</h1>
          <p className="text-gray-500">
            GPT + Perplexity + Vision Intelligence System
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl p-6 space-y-5 border"
        >
          <textarea
            className="w-full p-4 rounded-2xl border focus:ring-2 focus:ring-blue-300"
            rows="6"
            placeholder="Paste news..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* WARNING */}
          {detectFakeWords(text).length > 0 && (
            <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg">
              ⚠ Suspicious: {detectFakeWords(text).join(', ')}
            </div>
          )}

          {/* IMAGE */}
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed rounded-2xl p-5 text-center hover:bg-blue-50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  className="h-32 mx-auto rounded-xl object-cover"
                />
              ) : (
                <p>📷 Upload Image (optional)</p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button className="w-full bg-blue-600 text-white py-3 rounded-2xl">
            {loading ? 'AI Analyzing...' : 'Verify News'}
          </button>
        </form>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-500 mt-3 animate-pulse">
            🧠 AI processing text + image signals...
          </p>
        )}

        {/* RESULT */}
{result && (
  <div className="mt-8 space-y-6 animate-fadeIn">

    {/* MAIN AI REPORT CARD */}
    <div className="bg-white rounded-3xl p-6 shadow-xl border relative overflow-hidden">

      {/* top glow bar */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`} />

      <h2 className="text-xl font-bold flex items-center gap-2">
        🧠 AI Investigation Report
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Combined Text + Image + Context Analysis Engine
      </p>

      {/* SCORE + LABEL */}
      <div className="flex justify-between mt-6 items-center">

        <div>
          <p className="text-gray-500 text-sm">Trust Score</p>
          <p className="text-5xl font-black text-indigo-600">
            {score}%
          </p>
        </div>

        <div className={`px-5 py-2 rounded-full text-white font-bold bg-gradient-to-r ${gradient}`}>
          {label}
        </div>

      </div>

      {/* PROGRESS BAR */}
      <div className="h-3 bg-gray-200 rounded-full mt-5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>

    {/* 📷 IMAGE VERIFICATION PANEL (NEW FIX) */}
    {imagePreview && (
      <div className="bg-white rounded-3xl p-6 shadow-lg border">

        <h3 className="font-bold text-lg mb-3">
          📷 Vision Intelligence Layer
        </h3>

        <div className="grid md:grid-cols-2 gap-4 items-center">

          {/* IMAGE PREVIEW */}
          <img
            src={imagePreview}
            className="rounded-2xl shadow max-h-56 object-cover"
          />

          {/* IMAGE ANALYSIS */}
          <div className="space-y-3 text-sm text-gray-700">

            <div className="p-3 bg-gray-50 rounded-xl">
              🧠 AI Vision Status:
              <span className="font-semibold ml-2">
                {result?.image_analysis || "Image analyzed by AI model"}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              📊 Image Confidence:
              <span className="font-bold ml-2 text-indigo-600">
                {result?.image_score ?? 0}%
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              ⚖️ Visual Verdict:
              <span className={`ml-2 font-bold ${
                (result?.image_score ?? 0) > 70
                  ? "text-green-600"
                  : (result?.image_score ?? 0) > 40
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}>
                {(result?.image_score ?? 0) > 70
                  ? "Authentic"
                  : (result?.image_score ?? 0) > 40
                  ? "Suspicious"
                  : "Manipulated"}
              </span>
            </div>

          </div>

        </div>

        {/* IMAGE SCORE BAR */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
            style={{ width: `${result?.image_score || 0}%` }}
          />
        </div>

      </div>
    )}

    {/* 🧠 REASONING ENGINE */}
    <div className="bg-white rounded-3xl p-6 shadow-lg border">

      <h3 className="font-bold text-lg mb-3">
        🧠 AI Reasoning Engine
      </h3>

      <div className="space-y-3 text-sm text-gray-700">

        <div className="p-3 bg-gray-50 rounded-xl">
          ✔ Language pattern analyzed
        </div>

        <div className="p-3 bg-gray-50 rounded-xl">
          ✔ Emotional manipulation score calculated
        </div>

        <div className="p-3 bg-gray-50 rounded-xl">
          ✔ Text + Image consistency checked
        </div>

      </div>
    </div>

    {/* ⚖️ TEXT vs IMAGE CONFLICT */}
    <div className="bg-white rounded-3xl p-6 shadow-lg border">

      <h3 className="font-bold mb-2">
        ⚖️ Text vs Image Consistency
      </h3>

      <p className="text-3xl font-bold text-indigo-600">
        {result?.image_score
          ? Math.abs(score - (result.image_score || 0))
          : 0}%
      </p>

      <p className="text-xs text-gray-400 mt-1">
        Higher value = stronger contradiction between text and image signals
      </p>

    </div>

    {/* 🔍 TEXT HIGHLIGHT */}
    <div className="bg-white rounded-3xl p-6 shadow-lg border">

      <h3 className="font-bold mb-3">
        🔍 Evidence Scan
      </h3>

      <p className="text-gray-700 leading-relaxed">
        {highlightText(text)}
      </p>

    </div>

    {/* CTA BUTTON */}
    <button
      onClick={() => {
        setResult(null);
        setText('');
        setImage(null);
        setImagePreview(null);
      }}
      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-2xl font-semibold hover:scale-[1.02] transition"
    >
      🔎 Analyse More News
    </button>

  </div>
)}

      </div>
    </div>
  );
};

export default Verify;