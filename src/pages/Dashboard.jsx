import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import api from '../services/api';
import { getUser } from '../utils/auth';
import { formatDistanceToNow } from 'date-fns';

import Loader from '../components/Loader';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import Heatmap from '../components/Heatmap';
import NewsTable from '../components/NewsTable';

// Register Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const Dashboard = () => {
  const user = getUser();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    label: 'all',
    dateRange: ['', '']
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/news/history', { params: { limit: 200 } });
      setNews(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const filteredNews = useMemo(() => {
    let result = news;
    if (filters.search) result = result.filter(n => n.text?.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.label !== 'all') result = result.filter(n => n.label === filters.label);
    if (filters.dateRange[0] || filters.dateRange[1]) {
      const start = filters.dateRange[0] ? new Date(filters.dateRange[0]) : new Date(0);
      const end = filters.dateRange[1] ? new Date(filters.dateRange[1]) : new Date();
      result = result.filter(n => new Date(n.createdAt) >= start && new Date(n.createdAt) <= end);
    }
    return result.map(n => ({ ...n, isMisleading: n.trustScore < 40 }));
  }, [news, filters]);

  const stats = useMemo(() => ({
    total: filteredNews.length,
    real: filteredNews.filter(n => n.label === 'Real').length,
    fake: filteredNews.filter(n => n.label === 'Fake').length,
    misleading: filteredNews.filter(n => n.isMisleading).length
  }), [filteredNews]);

  const { total, real, fake, misleading } = stats;

  // Charts data...
  const pieData = {
    labels: ['Real', 'Fake', 'Misleading'],
    datasets: [{ data: [real, fake, misleading], backgroundColor: ['#10B981', '#EF4444', '#F59E0B'], borderWidth: 2, hoverOffset: 10 }]
  };

  const pieOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
    animation: { animateRotate: true, duration: 2000 }
  };

  const trustBins = useMemo(() => {
    const bins = { low: 0, med: 0, high: 0 };
    filteredNews.forEach(n => {
      const s = n.trustScore || 0;
      if (s < 40) bins.low++; else if (s < 70) bins.med++; else bins.high++;
    });
    return bins;
  }, [filteredNews]);

  const barData = {
    labels: ['Low (0-40)', 'Medium (40-70)', 'High (70-100)'],
    datasets: [{
      data: [trustBins.low, trustBins.med, trustBins.high],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderRadius: 12,
      borderSkipped: false
    }]
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    animation: { duration: 2000 }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <motion.main variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen glass-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-24">
        {/* Hero Header */}
        <motion.section className="hero-gradient rounded-3xl p-12 lg:p-20 mb-16 text-white glass overflow-hidden" variants={itemVariants}>
          <motion.div className="max-w-4xl">
            <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-6 leading-tight">
              Dashboard
            </h1>
            <p className="text-2xl opacity-90 mb-8 max-w-2xl leading-relaxed">Advanced analytics for your news verification journey. Track trust scores, geographic patterns, and more.</p>
            {user && (
              <motion.p className="text-xl font-semibold opacity-95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                Welcome back, <span className="text-transparent bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text">{user.name}</span>
              </motion.p>
            )}
          </motion.div>
        </motion.section>

        {error && (
          <motion.div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 mb-12 glass backdrop-blur-md" variants={itemVariants}>
            <div className="flex items-center space-x-4">
              <div className="glass rounded-2xl p-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-red-900">{error}</p>
                <button onClick={fetchNews} className="mt-2 px-6 py-2 glass rounded-2xl text-red-900 font-bold hover:glow-primary transition-all">
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={containerVariants} className="space-y-12">
          {/* Filters */}
          <motion.div variants={itemVariants}>
            <FilterBar filters={filters} onFilterChange={updateFilter} />
          </motion.div>

          {/* Stats */}
          <motion.section variants={itemVariants}>
            <h2 className="text-3xl font-black mb-12 text-gray-900 tracking-tight">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatsCard title="Total Verified" value={total.toLocaleString()} change={12} trend="up" icon="📊" color="text-indigo-600" />
              <StatsCard title="Real News" value={real} change={8} trend="up" icon="✅" color="text-emerald-600" />
              <StatsCard title="Fake News" value={fake} change={-3} trend="down" icon="❌" color="text-red-600" />
              <StatsCard title="Misleading" value={misleading} change={15} trend="up" icon="⚠️" color="text-amber-600" />
            </div>
          </motion.section>

          {/* Charts */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div className="glass-card rounded-3xl p-8 shadow-2xl" variants={itemVariants}>
                <h3 className="text-2xl font-bold mb-8 text-gray-900">Distribution</h3>
                {total ? <div className="h-80 lg:h-96"><Pie data={pieData} options={pieOptions} /></div> : <div className="h-80 flex items-center justify-center text-gray-400">No data yet</div>}
              </motion.div>
              <motion.div className="glass-card rounded-3xl p-8 shadow-2xl" variants={itemVariants}>
                <h3 className="text-2xl font-bold mb-8 text-gray-900">Trust Scores</h3>
                {total ? <div className="h-80 lg:h-96"><Bar data={barData} options={pieOptions} /></div> : <div className="h-80 flex items-center justify-center text-gray-400">No data yet</div>}
              </motion.div>
            </div>
          </motion.section>

          {/* Heatmap */}
          <motion.section variants={itemVariants}>
            <h3 className="text-2xl font-bold mb-8 text-gray-900">Geographic Insights</h3>
            <div className="glass-card rounded-3xl overflow-hidden">
              <Heatmap filteredNews={filteredNews} />
            </div>
          </motion.section>

          {/* Table */}
          <motion.section variants={itemVariants}>
            <h3 className="text-2xl font-bold mb-8 text-gray-900">Recent Activity</h3>
            <NewsTable filteredNews={filteredNews} currentPage={currentPage} onPageChange={setCurrentPage} />
          </motion.section>

          {/* Empty */}
          {total === 0 && !loading && !error && (
            <motion.div className="text-center py-32 glass-card rounded-3xl p-20" variants={itemVariants}>
              <motion.div className="w-32 h-32 glass rounded-full flex items-center justify-center mx-auto mb-12 glow-primary" animate={{ scale: [1, 1.05, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <span className="text-5xl">📈</span>
              </motion.div>
              <h3 className="text-4xl font-black text-gray-900 mb-4">No verifications yet</h3>
              <p className="text-xl text-gray-600 mb-12 max-w-lg mx-auto leading-relaxed">
                Get started by verifying news articles to unlock insights and analytics.
              </p>
              <motion.a 
                href="/verify"
                className="inline-flex items-center px-12 py-5 hero-gradient text-white font-bold rounded-3xl text-xl shadow-2xl hover:shadow-glow glow-primary transition-all duration-300 hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Verifying News
              </motion.a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
};

export default Dashboard;
