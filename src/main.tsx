import React from 'react'
import ReactDOM from 'react-dom/client'
import { useKakaoLoader } from 'react-kakao-maps-sdk'
import App from './App.tsx'
import { KakaoMapsLoading, KakaoMapsError, KakaoMapsApiKeyMissing } from './contexts/KakaoMapsContext'
import './index.css'

/**
 * Root Component with Kakao Maps SDK Initialization
 * Option 2B: useKakaoLoader at top level to ensure stable hook call order
 */
const Root = () => {
  // Validate Kakao Maps API Key
  const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return <KakaoMapsApiKeyMissing />;
  }

  // Initialize Kakao Maps SDK at the very top level
  const [loading, error] = useKakaoLoader({
    appkey: apiKey,
    libraries: ['services', 'clusterer'],
  });

  // Show loading state while SDK initializes
  if (loading) {
    return <KakaoMapsLoading />;
  }

  // Show error state if SDK fails to load
  if (error) {
    console.error('[Root] Kakao Maps SDK load failed:', error);
    return <KakaoMapsError error={error} apiKey={apiKey} />;
  }

  // SDK loaded successfully - render main app
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
