import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

import api from '../services/api';
import { getUser } from '../utils/auth';

import Loader from '../components/Loader';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import Heatmap from '../components/Heatmap';
import NewsTable from '../components/NewsTable';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
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

  // ---------------- FETCH DATA ----------------
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get('/api/news/history', {
        params: { limit: 200 }
      });

      setNews(data.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // ---------------- FILTERS ----------------
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const filteredNews = useMemo(() => {
    let result = news;

    if (filters.search) {
      result = result.filter(n =>
        n.text?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.label !== 'all') {
      result = result.filter(n => n.label === filters.label);
    }

    if (filters.dateRange[0] || filters.dateRange[1]) {
      const start = filters.dateRange[0]
        ? new Date(filters.dateRange[0])
        : new Date(0);

      const end = filters.dateRange[1]
        ? new Date(filters.dateRange[1])
        : new Date();

      result = result.filter(n => {
        const d = new Date(n.createdAt);
        return d >= start && d <= end;
      });
    }

    return result.map(n => ({
      ...n,
      isMisleading: (n.trustScore || 0) < 40
    }));
  }, [news, filters]);

  // ---------------- STATS ----------------
  const stats = useMemo(() => {
    return {
      total: filteredNews.length,
      real: filteredNews.filter(n => n.label === 'REAL').length,
      fake: filteredNews.filter(n => n.label === 'FAKE').length,
      misleading: filteredNews.filter(n => n.isMisleading).length
    };
  }, [filteredNews]);

  const { total, real, fake, misleading } = stats;

  // ---------------- CHART DATA ----------------
  const pieData = {
    labels: ['Real', 'Fake', 'Misleading'],
    datasets: [
      {
        data: [real, fake, misleading],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  const barData = {
    labels: ['Low (0-40)', 'Medium (40-70)', 'High (70-100)'],
    datasets: [
      {
        data: [
          filteredNews.filter(n => (n.trustScore || 0) < 40).length,
          filteredNews.filter(n => {
            const s = n.trustScore || 0;
            return s >= 40 && s < 70;
          }).length,
          filteredNews.filter(n => (n.trustScore || 0) >= 70).length
        ],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        borderRadius: 12
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  // ---------------- LOADING OVERLAY ----------------
  if (loading) {
    return <Loader />;
  }

  return (
    <motion.main
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ---------------- QUICK VERIFY INPUT ---------------- */}
        <motion.div
          variants={itemVariants}
          className="bg-white shadow rounded-2xl p-6 mb-10"
        >
          <h2 className="text-xl font-bold mb-3">
            🔎 Quick News Verification
          </h2>

          <div className="flex gap-3">
            <input
              className="flex-1 border p-3 rounded-xl"
              placeholder="Paste news headline..."
            />
            <button className="bg-blue-600 text-white px-6 rounded-xl">
              Verify
            </button>
          </div>
        </motion.div>

        {/* ---------------- HERO ---------------- */}
        <motion.section
          variants={itemVariants}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-10 rounded-3xl mb-10"
        >
          <h1 className="text-4xl font-bold">GeoTruth AI Dashboard</h1>
          <p className="mt-2 opacity-90">
            AI-powered news verification analytics system
          </p>

          {user && (
            <p className="mt-4 font-semibold">
              Welcome back, {user.name}
            </p>
          )}
        </motion.section>

        {/* ---------------- ERROR ---------------- */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">
            {error}
            <button
              onClick={fetchNews}
              className="ml-4 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ---------------- FILTERS ---------------- */}
        <FilterBar filters={filters} onFilterChange={updateFilter} />

        {/* ---------------- STATS ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <StatsCard title="Total" value={total} />
          <StatsCard title="Real" value={real} />
          <StatsCard title="Fake" value={fake} />
          <StatsCard title="Misleading" value={misleading} />
        </div>

        {/* ---------------- CHARTS ---------------- */}
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-bold mb-4">Distribution</h3>
            <Pie data={pieData} options={chartOptions} />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-bold mb-4">Trust Scores</h3>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* ---------------- HEATMAP ---------------- */}
        <div className="mt-10">
          <Heatmap filteredNews={filteredNews} />
        </div>

        {/* ---------------- TABLE ---------------- */}
        <div className="mt-10">
          <NewsTable
            filteredNews={filteredNews}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* ---------------- EMPTY STATE ---------------- */}
        {total === 0 && (
          <div className="text-center mt-20">
            <div className="text-5xl animate-pulse">🧠</div>
            <h2 className="text-2xl font-bold mt-4">
              No data yet
            </h2>
            <p className="text-gray-500">
              Start verifying news to see analytics
            </p>
          </div>
        )}
      </div>
    </motion.main>
  );
};

export default Dashboard;