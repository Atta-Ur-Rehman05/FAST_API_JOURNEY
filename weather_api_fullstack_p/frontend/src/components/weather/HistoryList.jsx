import { useEffect } from 'react';
import useWeatherStore from '../../store/weatherStore';

const HistoryList = ({ onHistoryClick }) => {
  const { history, fetchHistory } = useWeatherStore();

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!history || history.length === 0) {
    return (
      <div className="w-full text-center py-6">
        <p className="text-slate-500 text-sm">No recent search history.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-8">
      <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Recent Searches
      </h3>
      
      <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar">
        {history.slice(0, 15).map((item, idx) => (
          <button
            key={item.id || idx}
            onClick={() => onHistoryClick(item.city)}
            className="flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 px-5 py-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 hover:border-indigo-500/30 transition-all font-medium text-sm whitespace-nowrap shadow-sm"
          >
            {item.city}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
