import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react'

// 등기부 분석 결과는 Java 백엔드(8080)에 저장합니다.
const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'

type CheckStatus = 'ok' | 'caution' | 'danger' | 'pending'

interface CheckItem {
  id: number
  question: string
  confirmLabel: string
  status: CheckStatus
  summary: string
}

const CHECK_ITEMS_TEMPLATE: CheckItem[] = [
  { id: 1, question: '소유자 확인', confirmLabel: '등기상 소유자 정보', status: 'pending', summary: '' },
  { id: 2, question: '선순위 권리', confirmLabel: '근저당, 가압류 등 선순위 권리', status: 'pending', summary: '' },
  { id: 3, question: '소유권 변동 이력', confirmLabel: '소유권 이전 시점 및 빈도', status: 'pending', summary: '' },
  { id: 4, question: '공동 소유', confirmLabel: '공동 소유자 및 계약 동의 필요 여부', status: 'pending', summary: '' },
  { id: 5, question: '보증금 보호', confirmLabel: '선·후순위 권리 구조', status: 'pending', summary: '' },
  { id: 6, question: '계약 제한 사항', confirmLabel: '효력 제한, 목적물 특정 가능 여부', status: 'pending', summary: '' },
]

interface DeedDocumentDetailResponse {
  id: number
  sourceFilename?: string
  sourceMimeType?: string
  archived?: boolean
  createdAt?: string

  extractedText?: string
  structuredJson?: string
  sectionsJson?: string
  riskFlagsJson?: string
  checkItemsJson?: string
  explanation?: string
}

interface CheckItemResponse {
  status: 'ok' | 'caution' | 'danger' | 'pending'
  summary: string
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const config = {
    ok: { icon: CheckCircle, label: '확인', className: 'bg-green-100 text-green-800' },
    caution: { icon: AlertTriangle, label: '주의', className: 'bg-amber-100 text-amber-800' },
    danger: { icon: XCircle, label: '위험', className: 'bg-red-100 text-red-800' },
    pending: { icon: HelpCircle, label: '확인 전', className: 'bg-gray-100 text-gray-600' },
  }
  const { icon: Icon, label, className } = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

/** 위험 신호 설명 텍스트를 번호별 블록으로 나누어 렌더링 */
function RiskExplanationBlocks({ text }: { text: string }) {
  if (!text || !text.trim()) return null
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim())
  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => (
        <div key={idx} className="risk-item rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <div className="risk-item-body text-sm text-gray-700 whitespace-pre-wrap">{block}</div>
        </div>
      ))}
    </div>
  )
}

export default function DeedAnalysisPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState<'upload' | 'result'>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkResults, setCheckResults] = useState<CheckItem[]>(CHECK_ITEMS_TEMPLATE)
  const [uploadResult, setUploadResult] = useState<DeedDocumentDetailResponse | null>(null)
  const [riskExplanation, setRiskExplanation] = useState<string>('')
  const [riskFlags, setRiskFlags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const consumedAutoOpenRef = useRef(false)

  useEffect(() => {
    const state = location.state as { autoOpenFilePicker?: boolean } | null
    if (view === 'upload' && !consumedAutoOpenRef.current && state?.autoOpenFilePicker) {
      consumedAutoOpenRef.current = true
      fileInputRef.current?.click()
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate, view])

  const ensureDocumentConsent = async (options?: {
    returnAction?: 'filePicker'
    alertMessage?: string
  }) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return false
    }

    const alertMessage =
      options?.alertMessage ??
      '계약서 및 등기부등본 업로드·분석 기능을 이용하려면, 문서 저장 및 분석 처리에 대한 사전 동의가 필요합니다. \n\n동의 페이지로 이동합니다.'

    try {
      const res = await fetch(
        `http://localhost:8080/api/consents/required?types=${encodeURIComponent('DATA_STORE')}&version=${encodeURIComponent('v1.0')}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (res.status === 401) {
        navigate('/login')
        return false
      }

      if (!res.ok) {
        alert(alertMessage)
        navigate(
          `/consents/document?reason=required&types=${encodeURIComponent('DATA_STORE')}&version=${encodeURIComponent(
            'v1.0'
          )}&context=${encodeURIComponent('deed')}&next=${encodeURIComponent(location.pathname)}${
            options?.returnAction ? `&return=${encodeURIComponent(options.returnAction)}` : ''
          }`
        )
        return false
      }
      const data = (await res.json()) as { hasAll: boolean; missingTypes: string[] }
      if (data.hasAll) return true

      alert(alertMessage)
      navigate(
        `/consents/document?reason=required&types=${encodeURIComponent('DATA_STORE')}&version=${encodeURIComponent('v1.0')}&context=${encodeURIComponent(
          'deed'
        )}&next=${encodeURIComponent(location.pathname)}${
          options?.returnAction ? `&return=${encodeURIComponent(options.returnAction)}` : ''
        }`
      )
      return false
    } catch {
      alert(alertMessage)
      navigate(
        `/consents/document?reason=required&types=${encodeURIComponent('DATA_STORE')}&version=${encodeURIComponent('v1.0')}&context=${encodeURIComponent(
          'deed'
        )}&next=${encodeURIComponent(location.pathname)}${
          options?.returnAction ? `&return=${encodeURIComponent(options.returnAction)}` : ''
        }`
      )
      return false
    }
  }

  const openFilePicker = async () => {
    const ok = await ensureDocumentConsent({
      returnAction: 'filePicker',
    })
    if (!ok) return
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0]
    if (file) setUploadedFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const runAnalysis = async () => {
    if (!uploadedFile) return
    setError(null)
    setIsAnalyzing(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('로그인이 필요합니다. 먼저 로그인해 주세요.')
      }

      const form = new FormData()
      form.append('file', uploadedFile)

      const uploadRes = await fetch(`${BACKEND_BASE}/api/deed/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      })
      if (!uploadRes.ok) {
        const t = await uploadRes.text()
        throw new Error(t || `업로드 실패 (${uploadRes.status})`)
      }
      const saved: DeedDocumentDetailResponse = await uploadRes.json()
      setUploadResult(saved)

      // DB에 저장된 JSON 문자열 파싱
      const parsedRiskFlags: string[] = saved.riskFlagsJson ? JSON.parse(saved.riskFlagsJson) : []
      const parsedCheckItems: CheckItemResponse[] = saved.checkItemsJson ? JSON.parse(saved.checkItemsJson) : []
      setRiskFlags(parsedRiskFlags)
      setRiskExplanation(saved.explanation || '')

      if (parsedCheckItems && parsedCheckItems.length === 6) {
        const items = CHECK_ITEMS_TEMPLATE.map((item, idx) => ({
          ...item,
          status: parsedCheckItems[idx].status as CheckStatus,
          summary: parsedCheckItems[idx].summary,
        }))
        setCheckResults(items)
      } else {
        const flags = parsedRiskFlags || []
        const items = CHECK_ITEMS_TEMPLATE.map((item, idx) => {
          const summary = flags[idx] || (flags.length > 0 ? flags[0] : '분석 완료. 아래 위험 신호 설명을 확인하세요.')
          const status: CheckStatus = flags.length > 0 ? 'caution' : 'ok'
          return { ...item, summary, status }
        })
        setCheckResults(items)
      }
      setView('result')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.'
      const isNetworkError = msg === 'Failed to fetch' || msg.includes('fetch')
      setError(
        isNetworkError
          ? '서버에 연결할 수 없습니다. Java 백엔드(8080)와 FastAPI(8000)가 실행 중인지 확인해 주세요.'
          : msg
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setView('upload')
    setUploadedFile(null)
    setUploadResult(null)
    setRiskExplanation('')
    setRiskFlags([])
    setCheckResults(CHECK_ITEMS_TEMPLATE)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {view === 'upload' && (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">등기부등본 분석</h1>
            <p className="text-gray-600">
              등기부등본을 업로드하면, 사람들이 실제로 확인하고 싶은 6가지를 AI가 요약해 드립니다.
              이미지 또는 PDF 파일을 올려 주세요.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">본 분석은 법률 자문이 아니며, 정보 제공 목적입니다.</p>
              <p>정확한 판단이 필요하면 법률 전문가·등기소 확인을 권장합니다.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">등기부등본 이미지·PDF 업로드</h2>
            <div
              onClick={() => {
                void openFilePicker()
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-gray-50/50 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">등기부등본 이미지 또는 PDF를 업로드하세요</p>
              <p className="text-sm text-gray-500 mb-4">JPG, PNG, PDF 지원 · OCR 후 위험 신호 분석 제공</p>
              <button type="button" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                파일 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                onClick={(e) => {
                  // programmatic click도 버블링되므로 업로드 박스 onClick으로 전달 방지
                  e.stopPropagation()
                }}
                onChange={handleFileChange}
              />
            </div>

            {uploadedFile && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary-600" />
                  <span className="text-gray-700 font-medium">{uploadedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const ok = await ensureDocumentConsent()
                  if (!ok) return
                  void runAnalysis()
                })()
              }}
              disabled={!uploadedFile || isAnalyzing}
              className="mt-6 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  분석 중…
                </>
              ) : (
                '등기부등본 분석 시작'
              )}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">등기부등본 핵심 점검 항목 6가지</h3>
              <p className="text-sm text-gray-600">
                등기부등본을 AI로 분석해 계약 전 반드시 확인해야 할 주요 항목을 점검합니다.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {CHECK_ITEMS_TEMPLATE.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all bg-gray-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">{item.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm leading-snug">
                        {item.question}
                      </h4>
                      <div className="mt-2 px-3 py-1.5 bg-white rounded border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">확인 항목</div>
                        <div className="text-sm font-medium text-gray-800">{item.confirmLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'result' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={reset}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">등기부등본 분석 결과</h1>
                <p className="text-gray-600 mt-1">6가지 핵심 확인 항목 요약</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              본 AI 분석 결과는 법률 자문이 아니며, 정보 제공 목적입니다. 정확한 판단은 전문가 상담을 권장합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">등기부등본</h2>
              {uploadResult?.id ? (
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  {uploadResult.sourceMimeType?.includes('pdf') ? (
                    <iframe
                      src={`${BACKEND_BASE}/api/deed/documents/${uploadResult.id}/file`}
                      className="w-full h-80"
                      title="등기부 원본(PDF)"
                    />
                  ) : (
                    <img
                      src={`${BACKEND_BASE}/api/deed/documents/${uploadResult.id}/file`}
                      alt={uploadResult.sourceFilename || '등기부 원본'}
                      className="w-full max-h-80 object-contain bg-gray-50"
                    />
                  )}
                  <div className="p-2 text-xs text-gray-600 flex items-center justify-between">
                    <span className="truncate">{uploadResult.sourceFilename || `문서 #${uploadResult.id}`}</span>
                    <a
                      className="text-primary-600 hover:underline flex-shrink-0"
                      href={`${BACKEND_BASE}/api/deed/documents/${uploadResult.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      원본 열기
                    </a>
                  </div>
                </div>
              ) : (
                uploadedFile && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt={uploadedFile.name}
                      className="w-full max-h-80 object-contain bg-gray-50"
                    />
                    <p className="p-2 text-xs text-gray-600 truncate">{uploadedFile.name}</p>
                  </div>
                )
              )}
              {uploadResult?.extractedText && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">추출된 텍스트 보기</summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 overflow-auto max-h-48 whitespace-pre-wrap">
                    {uploadResult.extractedText}
                  </pre>
                </details>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              {checkResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:border-primary-200 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">{item.question}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{item.confirmLabel}</p>
                  <p className="text-sm text-gray-700">{item.summary || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {riskFlags.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">위험 신호 목록</h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 mb-4">
                {riskFlags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <h3 className="font-medium text-gray-900 mb-2">쉬운 설명</h3>
              <RiskExplanationBlocks text={riskExplanation} />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/contract/review"
              className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-primary-600" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">계약서 점검</h3>
                  <p className="text-sm text-gray-600">AI로 위험 조항 확인하기</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </Link>
            <Link
              to="/residency"
              className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">거주 관리</h3>
                  <p className="text-sm text-gray-600">입주·주거비·이슈 관리</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
