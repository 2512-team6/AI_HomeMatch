import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { installSessionExpiryInterceptor } from './api/sessionExpiry'
import './index.css'
import App from './App.tsx'

// 모든 API 요청에 대해 401 + TOKEN_EXPIRED 시 세션 만료 처리(1회, 로그인 페이지로 이동)
installSessionExpiryInterceptor()

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
