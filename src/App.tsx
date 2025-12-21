import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  KakaoMapsProvider,
  KakaoMapsLoading,
  KakaoMapsError,
  KakaoMapsApiKeyMissing,
  useKakaoMaps,
  DataSourceProvider,
  DataSourceSwitcher
} from './contexts';

/**
 * Main App Component
 * Layer 4: Global Context Providers
 * - KakaoMapsProvider: Kakao Maps SDK initialization
 * - DataSourceProvider: localStorage vs API switching
 */

/**
 * Inner App Component
 * Handles conditional rendering based on Kakao Maps state
 */
const AppContent = () => {
  const { loading, error, apiKey } = useKakaoMaps();

  // Show loading state while SDK initializes
  if (loading) {
    return <KakaoMapsLoading />;
  }

  // Show error state if SDK fails to load
  if (error) {
    console.error('[App] Kakao Maps SDK load failed:', error);
    return <KakaoMapsError error={error} apiKey={apiKey} />;
  }

  // SDK loaded successfully - render main app
  return (
    <ErrorBoundary>
      <div className="app">
        <RouterProvider router={router} />
        <DataSourceSwitcher />
      </div>
    </ErrorBoundary>
  );
};

/**
 * Root App Component with Context Providers
 */
function App() {
  // Validate Kakao Maps API Key
  const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return <KakaoMapsApiKeyMissing />;
  }

  return (
    <DataSourceProvider>
      <KakaoMapsProvider apiKey={apiKey} libraries={['services', 'clusterer']}>
        <AppContent />
      </KakaoMapsProvider>
    </DataSourceProvider>
  );
}

export default App;
