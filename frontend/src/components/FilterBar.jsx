import { memo } from 'react';

const FilterBar = memo(({ onFilterChange, filters }) => {
  const handleLabelChange = (e) => onFilterChange('label', e.target.value);
  const handleSearchChange = (e) => onFilterChange('search', e.target.value);
  const handleDateChange = (e) => onFilterChange('dateRange', [e.target.name === 'start' ? e.target.value : filters.dateRange[0], e.target.name === 'end' ? e.target.value : filters.dateRange[1]]);

  return (
    <div className="glass rounded-3xl p-8 mb-12 premium-scrollbar glass-card">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search News</span>
          </label>
          <div className="glass rounded-2xl p-4 border border-white/50">
            <input
              type="text"
              placeholder="Search news text, keywords..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full bg-transparent border-none focus:ring-0 p-0 text-lg font-medium placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
          <select
            value={filters.label || 'all'}
            onChange={handleLabelChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="all">All Labels</option>
            <option value="Real">Real</option>
            <option value="Fake">Fake</option>
            <option value="Misleading">Misleading</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div className="flex space-x-2">
            <input
              type="date"
              name="start"
              value={filters.dateRange[0]}
              onChange={handleDateChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 self-center">to</span>
            <input
              type="date"
              name="end"
              value={filters.dateRange[1]}
              onChange={handleDateChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default FilterBar;

