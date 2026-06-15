import { useMemo, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import useWeatherStore from '../../store/weatherStore';

const WeatherCard = ({ weather }) => {
  if (!weather) return null;

  // Derive gradient based on condition
  const gradientClass = useMemo(() => {
    const cond = weather.condition?.toLowerCase() || '';
    if (cond.includes('clear') || cond.includes('sun')) return 'from-amber-400 to-orange-500';
    if (cond.includes('cloud')) return 'from-blue-400 to-slate-500';
    if (cond.includes('rain') || cond.includes('drizzle')) return 'from-cyan-500 to-blue-700';
    if (cond.includes('snow')) return 'from-blue-100 to-blue-300 text-slate-800';
    if (cond.includes('thunder')) return 'from-purple-700 to-slate-900';
    return 'from-blue-500 to-indigo-600';
  }, [weather.condition]);

  const addFavorite = useWeatherStore((state) => state.addFavorite);
  const favorites = useWeatherStore((state) => state.favorites);
  const [isAdding, setIsAdding] = useState(false);

  // Check if current city is already in favorites
  const isFavorite = useMemo(() => {
    return favorites.some(f => f.city.toLowerCase() === weather.city.toLowerCase());
  }, [weather.city, favorites]);

  const handleFavoriteClick = async () => {
    if (isFavorite) {
      toast.info(`${weather.city} is already in your favorites`);
      return;
    }
    
    setIsAdding(true);
    const result = await addFavorite(weather.city);
    setIsAdding(false);
    
    if (result.success) {
      toast.success(`${weather.city} added to favorites!`);
    } else {
      toast.error(result.error || 'Failed to add favorite');
    }
  };

  return (
    <div className="relative group rounded-3xl overflow-hidden shadow-2xl transition-all hover:shadow-blue-500/20 max-w-md mx-auto w-full">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-90 backdrop-blur-3xl`}></div>
      
      <div className="relative p-8 z-10 text-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight">{weather.city}</h2>
              <button 
                onClick={handleFavoriteClick}
                disabled={isAdding || isFavorite}
                title={isFavorite ? "Already in favorites" : "Add to favorites"}
                className={`p-2 rounded-full transition-all ${isFavorite ? 'text-yellow-400 bg-white/10' : 'text-white/60 hover:text-yellow-400 hover:bg-white/20 active:scale-95'}`}
              >
                <svg className={`w-7 h-7 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
            <p className="text-xl font-medium opacity-90 mt-1 capitalize">{weather.condition}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            {/* Simple Dynamic Icon Logic */}
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {weather.condition?.toLowerCase().includes('sun') || weather.condition?.toLowerCase().includes('clear') ? (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              )}
            </svg>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-end">
          <div className="flex text-7xl font-black tracking-tighter">
            {weather.temperature?.replace('°C', '')}
            <span className="text-4xl mt-3 opacity-80">°C</span>
          </div>

          <div className="text-right flex flex-col gap-2">
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block">Humidity</span>
              <span className="text-lg font-bold">{weather.humidity}</span>
            </div>
            {/* If backend adds wind speed in the future */}
            {weather.wind_speed && (
               <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block">Wind</span>
                  <span className="text-lg font-bold">{weather.wind_speed}</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
