/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 에이전트 서버 주소. 비워 두면 서버 없이 목업으로만 돈다. */
  readonly VITE_IEUM_API_BASE?: string;
  /** 시연용 서버 키. 빌드 결과에 그대로 들어가므로 가벼운 차단으로만 본다(연동 계획 '보안'). */
  readonly VITE_IEUM_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
