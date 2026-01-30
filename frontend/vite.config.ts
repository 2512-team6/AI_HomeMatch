import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 등기부등본 분석 API (통합 FastAPI: core/RAG/api_server.py, 포트 8000)
      '/api/deed': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deed/, ''),
      },
    },
  },
})
