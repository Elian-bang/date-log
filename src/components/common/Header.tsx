import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Header Component
 * Global application header with navigation
 */

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Back button (only show on detail pages) */}
        {!isHomePage && (
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:text-primary-dark transition-colors"
            aria-label="Back to calendar"
          >
            ← Back
          </button>
        )}

        {/* Logo/Title */}
        <h1
          className={`text-2xl font-bold text-primary cursor-pointer ${
            isHomePage ? 'mx-auto' : ''
          }`}
          onClick={() => navigate('/')}
        >
          DateLog
        </h1>

        {/* Placeholder for future actions */}
        {!isHomePage && <div className="w-16" />}
      </div>
    </header>
  );
};
