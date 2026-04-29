import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { getUser } from '../utils/auth';

/**
 * Landing Page (Production Ready)
 * Hero section with welcome message and CTA to verify news.
 */
const Landing = () => {
  // Use useMemo for synchronous localStorage reads instead of useEffect
  const user = useMemo(() => getUser(), []);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'AI-Powered Analysis',
      description: 'Our advanced algorithms analyze text and images to detect fake news with high accuracy.',
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Location Verification',
      description: 'We use geolocation data to cross-reference news sources and add an extra layer of verification.',
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Instant Results',
      description: 'Get your trust score and verdict in seconds. No waiting, no complicated process.',
    },
  ];

  const steps = [
    { step: '1', title: 'Paste Content', desc: 'Enter the news article or content you want to verify.' },
    { step: '2', title: 'Upload Image', desc: 'Optionally upload an image related to the news.' },
    { step: '3', title: 'AI Analysis', desc: 'Our system analyzes the content using multiple signals.' },
    { step: '4', title: 'Get Results', desc: 'Receive a trust score and verdict instantly.' },
  ];

  return (
    <main id="main-content" className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center">
          {/* Welcome message */}
          {user?.name && (
            <p className="text-blue-600 font-medium text-sm uppercase tracking-wide mb-4 animate-fade-in">
              Welcome back, {user.name}
            </p>
          )}

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Detect{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              Fake News
            </span>{' '}
            with AI
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed">
            GeoTruth AI analyzes news articles and images to help you identify
            misinformation, fake stories, and misleading content in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/verify"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-center"
            >
              Verify News Now
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 text-center"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* How It Works */}
        <section className="mt-20" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

/**
 * Reusable feature card component
 */
const FeatureCard = ({ icon, title, description }) => (
  <article className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-100 hover:-translate-y-0.5">
    <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </article>
);

export default Landing;

