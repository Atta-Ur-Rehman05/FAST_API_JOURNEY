import { toast } from 'react-toastify';
import useWeatherStore from '../../store/weatherStore';

const FavoriteCityCard = ({ favorite, onCityClick }) => {
  const removeFavorite = useWeatherStore((state) => state.removeFavorite);

  const handleRemove = async (e) => {
    e.stopPropagation(); // prevent clicking the card
    const result = await removeFavorite(favorite.id);
    if (result.success) {
       toast.success(`Removed ${favorite.city} from favorites`);
       if (result.mocked) {
          toast.info('Note: Backend deletion is not fully supported, this is a local preview.', { autoClose: 3000 });
       }
    } else {
       toast.error(result.error || 'Failed to remove favorite');
    }
  };

  return (
    <div 
      onClick={() => onCityClick(favorite.city)}
      className="group relative bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl shadow-xl hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer transform hover:-translate-y-1 overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 blur-xl transition-all duration-500"></div>

      <div className="relative z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-100 capitaize tracking-tight">{favorite.city}</h3>
        </div>
        
        <button
          onClick={handleRemove}
          title="Remove from favorites"
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FavoriteCityCard;
