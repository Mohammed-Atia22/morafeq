// src/components/ui/LoadingSpinner.jsx
// --------------------------------------------------
// Reusable loading state. Use anywhere data is fetching.
// usage: <LoadingSpinner />
//        <LoadingSpinner message="جارٍ تحميل العقارات..." />
//        <LoadingSpinner size="sm" />
// --------------------------------------------------

const sizes = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

const LoadingSpinner = ({ message = "جارٍ التحميل...", size = "md", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <div
        className={`${sizes[size]} border-blue-100 border-t-primary-600 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-gray-400 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;