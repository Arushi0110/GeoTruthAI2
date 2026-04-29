import { memo } from 'react';

const StatsCard = ({ title, value, change = null, trend = 'up', icon, color = 'text-indigo-600', trendColor = 'text-emerald-600' }) => (

  <div className="glass rounded-3xl p-8 relative overflow-hidden group hover:glass hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 glass-card">
    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur opacity-75 group-hover:opacity-100 transition duration-1000" />
    <div className="relative z-10 flex items-center justify-between">
      <div className="space-y-4">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-500">{title}</p>
        <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 bg-clip-text text-transparent">{value}</p>
        {change !== null && (
          <p className={`flex items-center space-x-1 text-sm font-bold ${trendColor}`}>
            <span>{trend === 'up' ? '↑' : '↓'}</span>
            <span>{Math.abs(change)}% from last week</span>
          </p>
        )}
      </div>
      <div className="glass rounded-2xl p-4 shadow-lg w-20 h-20 flex items-center justify-center shrink-0">
        <span className={`text-3xl group-hover:scale-110 transition-all duration-300 ${color}`}>{icon}</span>
      </div>
    </div>
  </div>
);

export default memo(StatsCard);
