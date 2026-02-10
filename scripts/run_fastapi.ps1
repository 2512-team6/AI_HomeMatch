# 계약서 분석용 FastAPI 서버 실행 (포트 8000)
# 배포(Render)와 동일하게 core 를 루트로 두고 RAG.api_server 로 실행
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$coreDir = Join-Path $scriptDir "..\core"
Set-Location $coreDir

Write-Host "[FastAPI] core 에서 RAG.api_server 로 서버 시작..." -ForegroundColor Cyan
Write-Host "[FastAPI] http://localhost:8000" -ForegroundColor Cyan
Write-Host "[FastAPI] API 문서: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

python -m uvicorn RAG.api_server:app --host 0.0.0.0 --port 8000
