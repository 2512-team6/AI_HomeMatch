import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_BASE_URL || ''

  const proxy: Record<string, { target: string; changeOrigin: boolean; rewrite?: (path: string) => string }> = {}

  if (backendUrl) {
    // 배포 백엔드(Cloudtype 등) 사용 시: /api 전부 해당 URL로
    proxy['/api'] = { target: backendUrl, changeOrigin: true }
  } else {
    // 로컬 개발 시: /api 전부 로컬 Java(8080)로. 등기부등본은 Java가 내부에서 FastAPI(8000) 호출
    proxy['/api'] = { target: 'http://localhost:8080', changeOrigin: true }
  }

  return {
    plugins: [react()],
    server: {
      proxy,
    },
  }
})
