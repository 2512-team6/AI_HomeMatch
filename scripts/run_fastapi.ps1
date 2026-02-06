# 계약서 분석용 FastAPI 서버 실행 (포트 8000)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ragDir = Join-Path $scriptDir "..\core\RAG"
Set-Location $ragDir

Write-Host "[FastAPI] core/RAG 디렉터리에서 서버 시작..." -ForegroundColor Cyan
Write-Host "[FastAPI] http://localhost:8000" -ForegroundColor Cyan
Write-Host "[FastAPI] API 문서: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

python -m uvicorn api_server:app --host 0.0.0.0 --port 8000
