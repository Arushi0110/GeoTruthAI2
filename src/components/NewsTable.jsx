import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';

const getLabelColor = (label) => {
  switch (label) {
    case 'Real': return 'bg-green-100 text-green-800 border-green-200';
    case 'Fake': return 'bg-red-100 text-red-800 border-red-200';
    case 'Misleading': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTrustColor = (score) => {
  if (score > 70) return 'bg-green-100 text-green-800';
  if (score < 40) return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

const NewsTable = memo(({ filteredNews, currentPage = 1, pageSize = 10, onPageChange }) => {
  const totalPages = Math.ceil(filteredNews.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">News Preview</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trust Score</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Label</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedNews.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No news matching filters
                </td>
              </tr>
            ) : (
              paginatedNews.map((news, index) => (
                <tr key={news._id || index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2 max-w-md">
                      {news.text?.substring(0, 100)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTrustColor(news.trustScore)}`}>
                      {news.trustScore || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getLabelColor(news.label)}`}>
                      {news.label || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {news.createdAt ? formatDistanceToNow(new Date(news.createdAt), { addSuffix: true }) : 'Unknown'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <nav className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredNews.length)} of {filteredNews.length} results
            </div>
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
});

NewsTable.displayName = 'NewsTable';

export default NewsTable;
