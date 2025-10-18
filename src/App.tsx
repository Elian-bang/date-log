import { RouterProvider } from 'react-router-dom';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
import { router } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';

/**
 * Main App Component
 * Initializes Kakao Maps SDK and provides routing
 */

function App() {
  // Initialize Kakao Maps SDK
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY || '',
    libraries: ['services', 'clusterer'],
  });

  // Show loading state while SDK initializes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Show error state if SDK fails to load
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white rounded-lg shadow-xl p-6 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">지도 로드 실패</h1>
          <p className="text-gray-600 mb-4">Kakao 지도를 불러오는데 실패했습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <RouterProvider router={router} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
