/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly VITE_KAKAO_MAP_API_KEY?: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_ENABLE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
