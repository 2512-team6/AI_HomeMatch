@echo off
REM 계약서 분석용 FastAPI 서버 실행 (포트 8000)
REM 배포(Render)와 동일하게 core 를 루트로 두고 RAG.api_server 로 실행
cd /d "%~dp0..\core"
echo [FastAPI] core 에서 RAG.api_server 로 서버 시작...
echo [FastAPI] http://localhost:8000
echo [FastAPI] API 문서: http://localhost:8000/docs
echo.
python -m uvicorn RAG.api_server:app --host 0.0.0.0 --port 8000
pause
