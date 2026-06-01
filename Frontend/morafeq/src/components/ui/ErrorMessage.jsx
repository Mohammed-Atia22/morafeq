// src/components/ui/ErrorMessage.jsx
// --------------------------------------------------
// Reusable error state with optional retry button.
// usage: <ErrorMessage message={error} />
//        <ErrorMessage message={error} onRetry={refetch} />
// --------------------------------------------------

const ErrorMessage = ({ message = "حدث خطأ ما", onRetry = null, className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}>
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium text-sm text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-bold text-primary-600 hover:text-primary-800 border border-primary-200 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
        >
          حاول مرة أخرى
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;