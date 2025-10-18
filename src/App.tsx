import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

/**
 * Main App Component
 */

function App() {
  return (
    <div className="app">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
