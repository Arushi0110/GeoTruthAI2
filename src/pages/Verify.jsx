import { useState, useRef } from 'react';
import axios from 'axios';

/**
 * Verify News Page
 * Form to submit news content and images for analysis.
 * Captures geolocation and sends data to the backend API.
 */
const Verify = () => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Handle image file selection and preview generation
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Get user's geolocation using browser API
   * Returns Promise that resolves with { lat, lng }
   */
  const getGeolocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          reject(new Error(`Geolocation error: ${err.message}`));
        }
      );
    });
  };

  /**
   * Get Tailwind color classes based on label type
   */
  const getLabelColor = (label) => {
    switch (label?.toLowerCase()) {
      case 'real':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'fake':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'misleading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  /**
   * Get text color based on trust score value
   */
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Get geolocation
      const location = await getGeolocation();

      // Step 2: Build FormData payload
      const formData = new FormData();
      formData.append('text', text);
      formData.append('location', JSON.stringify(location));
      if (image) {
        formData.append('image', image);
      }

      // Step 3: Send POST request via Axios
      const response = await axios.post(
        'http://localhost:5000/api/news/analyze',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Step 4: Store result
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'An error occurred while analyzing the news.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset the entire form
   */
  const handleReset = () => {
    setText('');
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h1 className="text-2xl font-bold text-white text-center">
            News Verification
          </h1>
          <p className="text-blue-100 text-center mt-1 text-sm">
            Verify the authenticity of news with AI-powered analysis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {/* Textarea */}
          <div>
            <label htmlFor="news-text" className="block text-sm font-semibold text-gray-700 mb-2">
              News Content
            </label>
            <textarea
              id="news-text"
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors text-gray-800 placeholder-gray-400"
              placeholder="Paste the news article or content you want to verify..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="news-image" className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Image (Optional)
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                id="news-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="news-image"
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                {imagePreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 rounded-lg mb-2 object-contain"
                    />
                    <span className="text-sm text-blue-600 font-medium">{image.name}</span>
                    <span className="text-xs text-gray-500 mt-1">Click to change image</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Click to upload an image</span>
                    <span className="text-xs mt-1">Supports JPG, PNG, GIF</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : (
              'Verify News'
            )}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="px-8 pb-8">
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Analysis Result</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Trust Score */}
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Trust Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(result.trustScore || result.trust_score || 0)}`}>
                    {result.trustScore || result.trust_score || 0}%
                  </p>
                </div>

                {/* Label */}
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Verdict</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border ${getLabelColor(result.label)}`}>
                    {result.label || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Additional Details */}
              {result.confidence && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Confidence: <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                  </p>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Verify Another News
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verify;
