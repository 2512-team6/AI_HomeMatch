/**
 * [선택 구현] 세션 곧 만료(예: 5분 전) 알림 및 연장 설계
 *
 * 설계 요약:
 * 1. Access Token의 만료 시각(exp)은 클라이언트에서 디코딩만 하면 됨 (검증은 서버에서).
 * 2. 만료 5분 전에 한 번만 "세션이 곧 만료됩니다. 연장하시겠습니까?" 모달 표시.
 * 3. [연장] 클릭 시:
 *    - 옵션 A: 백엔드에 POST /api/auth/refresh (현재 access token 전달) → 새 access token 발급.
 *    - 옵션 B: refresh token 미도입 시 "다시 로그인"으로 유도만 (현재와 동일).
 * 4. [다시 로그인] 클릭 시: returnUrl 저장 후 /login으로 이동.
 *
 * 아래 getAccessTokenExpiryMs()는 JWT payload의 exp(초 단위)를 읽어
 * 만료 시각(ms)을 반환. 모달 타이머 설정 시 사용.
 */

const JWT_PAYLOAD_BASE64 = 1

/**
 * localStorage의 access token에서 만료 시각(ms, UTC)을 읽습니다.
 * 서명 검증은 하지 않으며, 표시/타이머 용도로만 사용합니다.
 * @returns 만료 시각(ms) 또는 파싱 실패 시 null
 */
export function getAccessTokenExpiryMs(): number | null {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      atob(parts[JWT_PAYLOAD_BASE64].replace(/-/g, '+').replace(/_/g, '/'))
    ) as { exp?: number }
    if (typeof payload.exp !== 'number') return null
    return payload.exp * 1000
  } catch {
    return null
  }
}

/** 만료까지 남은 시간(ms). 만료 후면 0 이하. */
export function getMsUntilExpiry(): number {
  const exp = getAccessTokenExpiryMs()
  if (exp == null) return 0
  return exp - Date.now()
}

/**
 * 세션 곧 만료 알림을 표시할 시점(ms). 예: 만료 5분 전 = 5 * 60 * 1000
 */
export const SESSION_EXPIRY_WARNING_MS = 5 * 60 * 1000
