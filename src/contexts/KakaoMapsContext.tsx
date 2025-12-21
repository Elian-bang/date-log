/**
 * Kakao Maps Context
 * Global state management for Kakao Maps SDK
 * - SDK loading state
 * - API key validation
 * - Error handling
 * - Initialization configuration
 */

import { createContext, useContext, ReactNode } from 'react';
import { useKakaoLoader } from 'react-kakao-maps-sdk';

interface KakaoMapsContextValue {
  loading: boolean;
  error: ErrorEvent | undefined;
  apiKey: string;
  isReady: boolean;
}

const KakaoMapsContext = createContext<KakaoMapsContextValue | undefined>(undefined);

interface KakaoMapsProviderProps {
  children: ReactNode;
  apiKey: string;
  libraries?: ('services' | 'clusterer' | 'drawing')[];
}

export const KakaoMapsProvider = ({
  children,
  apiKey,
  libraries = ['services', 'clusterer']
}: KakaoMapsProviderProps) => {
  // Initialize Kakao Maps SDK
  const [loading, error] = useKakaoLoader({
    appkey: apiKey,
    libraries,
  });

  const isReady = !loading && !error;

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[KakaoMapsContext] API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('[KakaoMapsContext] Loading:', loading);
    console.log('[KakaoMapsContext] Error:', error);
    console.log('[KakaoMapsContext] Ready:', isReady);
  }

  return (
    <KakaoMapsContext.Provider value={{ loading, error, apiKey, isReady }}>
      {children}
    </KakaoMapsContext.Provider>
  );
};

/**
 * Hook to access Kakao Maps context
 */
export const useKakaoMaps = (): KakaoMapsContextValue => {
  const context = useContext(KakaoMapsContext);

  if (context === undefined) {
    throw new Error('useKakaoMaps must be used within KakaoMapsProvider');
  }

  return context;
};

/**
 * Loading Screen Component
 */
export const KakaoMapsLoading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">지도를 불러오는 중...</p>
      </div>
    </div>
  );
};

/**
 * Error Screen Component
 */
interface KakaoMapsErrorProps {
  error: ErrorEvent;
  apiKey: string;
}

export const KakaoMapsError = ({ error, apiKey }: KakaoMapsErrorProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">지도 로드 실패</h1>
        <p className="text-gray-600 mb-4">Kakao 지도를 불러오는데 실패했습니다.</p>

        {/* Error Details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
          <p className="text-xs font-semibold text-red-800 mb-1">오류 상세:</p>
          <p className="text-xs text-red-700 font-mono break-all">
            {error?.message || JSON.stringify(error)}
          </p>
        </div>

        {/* Troubleshooting Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
          <p className="text-xs font-semibold text-blue-800 mb-2">문제 해결 방법:</p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>브라우저 콘솔(F12)에서 상세 오류 확인</li>
            <li>네트워크 연결 확인</li>
            <li>브라우저 캐시 삭제 후 재시도</li>
            <li>다른 브라우저에서 테스트</li>
            <li>Kakao 개발자 콘솔에서 플랫폼 도메인 등록 확인</li>
          </ul>
        </div>

        {/* API Key Info */}
        <div className="bg-gray-100 rounded-lg p-3 mb-4 text-left">
          <p className="text-xs text-gray-700">
            <span className="font-semibold">API Key:</span>{' '}
            <code className="text-green-600">{apiKey.substring(0, 10)}...</code>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            다시 시도
          </button>
          <a
            href="https://developers.kakao.com/console/app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            API 설정
          </a>
        </div>
      </div>
    </div>
  );
};

/**
 * API Key Missing Screen Component
 */
export const KakaoMapsApiKeyMissing = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center bg-white rounded-lg shadow-xl p-6 max-w-md">
        <div className="text-6xl mb-4">🔑</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">API 키 설정 필요</h1>
        <p className="text-gray-600 mb-4">
          Kakao Map API 키가 설정되지 않았습니다.
        </p>
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <p className="text-xs text-gray-700 mb-2 font-semibold">환경 변수 설정 방법:</p>
          <code className="block bg-gray-800 text-green-400 p-3 rounded text-xs text-left font-mono">
            VITE_KAKAO_MAP_API_KEY=your_api_key
          </code>
        </div>
        <div className="text-xs text-gray-600 text-left space-y-2">
          <p>1. 프로젝트 루트에 <code className="bg-gray-200 px-1 rounded">.env</code> 파일 생성</p>
          <p>2. 위 환경 변수 추가</p>
          <p>3. 개발 서버 재시작: <code className="bg-gray-200 px-1 rounded">npm run dev</code></p>
          <p className="mt-3 pt-3 border-t">
            API 키 발급: <a
              href="https://developers.kakao.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark underline"
            >
              developers.kakao.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
