/**
 * 세션 만료 시 전역 처리 (1회만 실행).
 * - 401 + errorCode TOKEN_EXPIRED 응답 시 저장된 세션 제거 후 로그인 페이지로 이동.
 * - returnUrl을 쿼리로 넘겨 로그인 후 복귀 가능하게 함.
 */

let sessionExpiryHandled = false

function isApiRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString()
  return url.includes('/api/')
}

function handleSessionExpired(): void {
  if (sessionExpiryHandled) return
  sessionExpiryHandled = true

  localStorage.removeItem('accessToken')
  localStorage.removeItem('nickname')
  localStorage.removeItem('role')

  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?reason=session_expired&returnUrl=${returnUrl}`
}

/**
 * 401 응답 body가 TOKEN_EXPIRED인지 확인 후 세션 만료 처리.
 * 호출 측에서 response는 그대로 반환해 기존 코드가 그대로 동작하도록 함.
 */
export function checkSessionExpiry(response: Response, requestInput?: RequestInfo | URL): Response {
  if (response.status !== 401) return response
  if (requestInput !== undefined && !isApiRequest(requestInput)) return response

  const cloned = response.clone()
  cloned
    .json()
    .then((body: { errorCode?: string }) => {
      if (body?.errorCode === 'TOKEN_EXPIRED') handleSessionExpired()
    })
    .catch(() => {})
  return response
}

const originalFetch = window.fetch

/**
 * 앱에서 사용할 fetch 래퍼. 모든 API 요청에 대해 401 + TOKEN_EXPIRED 시 세션 만료 플로우 실행.
 */
export function installSessionExpiryInterceptor(): void {
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return originalFetch.call(this, input, init).then((response) => {
      return checkSessionExpiry(response, input)
    })
  }
}
