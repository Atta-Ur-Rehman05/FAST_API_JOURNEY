import { useMemo } from 'react';

const ForecastCard = () => {
  // Demo Data since backend /weather endpoint currently doesn't provide multi-day forecast.
  const dummyForecast = useMemo(() => {
    return [
      { day: 'Mon', temp: '16°', icon: 'sun' },
      { day: 'Tue', temp: '18°', icon: 'cloud-sun' },
      { day: 'Wed', temp: '14°', icon: 'rain' },
      { day: 'Thu', temp: '13°', icon: 'cloud' },
      { day: 'Fri', temp: '19°', icon: 'sun' },
      { day: 'Sat', temp: '22°', icon: 'sun' },
      { day: 'Sun', temp: '20°', icon: 'cloud' },
    ];
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'sun':
        return <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
      case 'cloud':
        return <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
      case 'cloud-sun':
        return <svg className="w-8 h-8 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
      case 'rain':
        return <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>; // placeholder rain icon
      default:
        return <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl mt-8 max-w-4xl mx-auto w-full group">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">7-Day Forecast</h3>
        <span className="text-xs font-semibold px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">Demo Mode</span>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
        {dummyForecast.map((day, ix) => (
          <div key={ix} className="snap-start flex flex-col items-center justify-center min-w-[100px] bg-slate-900/50 border border-slate-700/30 rounded-2xl py-5 shadow-lg hover:bg-slate-800 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
            <span className="text-sm font-semibold text-slate-400 mb-2">{day.day}</span>
            <div className="mb-3">
              {getIcon(day.icon)}
            </div>
            <span className="text-xl font-bold text-slate-100">{day.temp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastCard;
