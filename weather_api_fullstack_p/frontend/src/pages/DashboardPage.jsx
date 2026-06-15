import { useEffect } from 'react';
import useWeatherStore from '../store/weatherStore';
import SearchBar from '../components/weather/SearchBar';
import WeatherCard from '../components/weather/WeatherCard';
import ForecastCard from '../components/weather/ForecastCard';
import HistoryList from '../components/weather/HistoryList';
import ErrorMessage from '../components/common/ErrorMessage';
import Loader from '../components/common/Loader';

const DashboardPage = () => {
  const { weather, loading, error, fetchWeather, clearWeather } = useWeatherStore();

  useEffect(() => {
    // Optionally render a default city on mount if none is selected
    // if (!weather) { fetchWeather('London'); }
    
    // Clear on unmount
    return () => {
      // clearWeather(); // Enable if we don't want persistence between page navigations
    };
  }, []);

  const handleSearch = (cityName) => {
    fetchWeather(cityName);
  };

  return (
    <div className="py-2 px-4 sm:px-0 flex flex-col min-h-[calc(100vh-140px)]">
      
      <div className="w-full text-center mt-4 mb-10">
        <h2 className="text-4xl font-extrabold text-white mb-4">Current Weather tracking</h2>
        <p className="text-slate-400">Search for any city around the globe.</p>
      </div>

      <SearchBar onSearch={handleSearch} isLoading={loading} />

      <div className="flex-1 w-full flex flex-col items-center transition-all duration-700">
        {loading && (
          <div className="flex-1 flex justify-center items-center mt-12">
            <Loader />
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 w-full">
            <ErrorMessage message={error} />
          </div>
        )}

        {weather && !loading && !error && (
          <div className="w-full flex-col items-center transition-all duration-500 transform translate-y-0 opacity-100">
            <WeatherCard weather={weather} />
            <ForecastCard />
          </div>
        )}

        {!weather && !loading && !error && (
          <div className="mt-16 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700 shadow-xl">
               <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <p className="text-slate-400 text-lg">Your dashboard is empty.<br/> Use the search bar above to fetch real-time weather data.</p>
          </div>
        )}
      </div>

      {/* Put history list at the bottom */}
      <div className="mt-auto pt-8">
        <HistoryList onHistoryClick={handleSearch} />
      </div>

    </div>
  );
};

export default DashboardPage;
