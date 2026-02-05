/**
 * 백엔드 API 베이스 URL.
 * - 개발 모드(DEV): 항상 '' → Vite 프록시 사용. 프록시는 VITE_BACKEND_BASE_URL 있으면 그쪽, 없으면 localhost:8080
 * - 프로덕션: VITE_BACKEND_BASE_URL 또는 fallback http://localhost:8080
 */

// 로컬 개발용 주소
// export const API_BASE = import.meta.env.DEV
//   ? ''
//   : (import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080')

// 로컬 네트워크 공유용 주소
export const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_BACKEND_BASE_URL || 'http://192.168.0.32:8080')