import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataSourceProvider, DataSourceSwitcher } from './contexts';
import { migrateMemoFields } from './utils/migrateMemoFields';

/**
 * Main App Component
 * Layer 4: Global Context Providers
 * - DataSourceProvider: localStorage vs API switching
 *
 * Note: Kakao Maps SDK initialization moved to main.tsx (Option 2B)
 * to ensure stable hook call order and prevent React Error #310
 */
function App() {
  // Run memo fields migration on app initialization
  useEffect(() => {
    migrateMemoFields();
  }, []);

  return (
    <DataSourceProvider>
      <ErrorBoundary>
        <div className="app">
          <RouterProvider router={router} />
          <DataSourceSwitcher />
        </div>
      </ErrorBoundary>
    </DataSourceProvider>
  );
}

export default App;
