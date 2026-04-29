import { memo } from 'react';

const Loader = ({ className = '' }) => (
  <div className={`flex flex-col items-center justify-center p-12 space-y-4 ${className}`}>
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    <p className="text-gray-600 font-medium">Loading dashboard data...</p>
  </div>
);

export default memo(Loader);
