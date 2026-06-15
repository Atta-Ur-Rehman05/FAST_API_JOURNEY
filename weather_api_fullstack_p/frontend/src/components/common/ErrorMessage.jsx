const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-md text-red-400 px-6 py-4 rounded-2xl flex items-center gap-3 w-full max-w-2xl mx-auto shadow-lg shadow-red-500/10">
      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="font-medium">{message}</p>
    </div>
  );
};

export default ErrorMessage;
