import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWeatherStore from '../store/weatherStore';
import FavoriteCityCard from '../components/favorites/FavoriteCityCard';

const FavoritesPage = () => {
  const { favorites, fetchFavorites, fetchWeather } = useWeatherStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCityClick = (cityName) => {
    // Setting up the dashboard with this city and redirecting
    fetchWeather(cityName);
    navigate('/dashboard');
  };

  return (
    <div className="py-8 px-4 sm:px-0 min-h-[calc(100vh-140px)]">
      
      <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-4xl font-extrabold text-white mb-4">Your Favorites</h2>
        <p className="text-slate-400">Manage your saved cities for quick access.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center mt-20 animate-in fade-in zoom-in-95 duration-700">
          <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700 shadow-xl mb-6">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-xl text-slate-300">You haven't saved any cities yet.</p>
          <p className="mt-2 text-slate-500">Go to the dashboard and click the star icon on any weather card!</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
          {favorites.map((favorite) => (
            <FavoriteCityCard 
              key={favorite.id} 
              favorite={favorite} 
              onCityClick={handleCityClick} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
