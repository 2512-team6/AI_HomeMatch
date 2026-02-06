@echo off
REM 계약서 분석용 FastAPI 서버 실행 (포트 8000)
cd /d "%~dp0..\core\RAG"
echo [FastAPI] core/RAG 디렉터리에서 서버 시작...
echo [FastAPI] http://localhost:8000
echo [FastAPI] API 문서: http://localhost:8000/docs
echo.
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000
pause
