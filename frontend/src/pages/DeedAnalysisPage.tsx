import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
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

// 개발 시 Vite 프록시 사용: /api/deed → localhost:8000 (core/RAG/api_server.py 실행 필요)
const DEED_API_URL = import.meta.env.VITE_DEED_API_URL ?? ''
const DEED_BASE = DEED_API_URL || '/api/deed'

type CheckStatus = 'ok' | 'caution' | 'danger' | 'pending'

interface CheckItem {
  id: number
  question: string
  confirmLabel: string
  status: CheckStatus
  summary: string
}

const CHECK_ITEMS_TEMPLATE: CheckItem[] = [
  { id: 1, question: '이 사람이 진짜 주인인가?', confirmLabel: '소유자 일치 여부', status: 'pending', summary: '' },
  { id: 2, question: '보증금보다 먼저 가져갈 권리가 있는가?', confirmLabel: '근저당·가압류 등 권리 존재', status: 'pending', summary: '' },
  { id: 3, question: '이 집, 왜 이렇게 최근에 손바뀜 됐지?', confirmLabel: '소유권 이전 시점', status: 'pending', summary: '' },
  { id: 4, question: '나 말고 계약 권한 있는 사람이 또 있나?', confirmLabel: '공동 소유 여부', status: 'pending', summary: '' },
  { id: 5, question: '내 보증금은 몇 번째 순서인가?', confirmLabel: '선순위 권리 구조', status: 'pending', summary: '' },
  { id: 6, question: '이 계약, 법적으로 특정이 되는가?', confirmLabel: '호실·목적물 특정 가능 여부', status: 'pending', summary: '' },
]

interface UploadResponse {
  document_id: number
  extracted_text: string
  parsed_data: Record<string, unknown>
  sections: { pyojebu?: string; gapgu?: string; eulgu?: string }
  regions?: Array<{ bbox: number[][]; text: string; confidence: number }>
  image_data_url?: string
}

interface CheckItemResponse {
  status: 'ok' | 'caution' | 'danger' | 'pending'
  summary: string
}

interface RiskAnalysisResponse {
  success: boolean
  document_id: number
  structured: Record<string, unknown>
  risk_flags: string[]
  explanation: string
  check_items?: CheckItemResponse[]  // 6가지 질문별 답변
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
  const [view, setView] = useState<'upload' | 'result'>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkResults, setCheckResults] = useState<CheckItem[]>(CHECK_ITEMS_TEMPLATE)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [riskExplanation, setRiskExplanation] = useState<string>('')
  const [riskFlags, setRiskFlags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0]
    if (file) setUploadedFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const runAnalysis = async () => {
    if (!uploadedFile) return
    setError(null)
    setIsAnalyzing(true)
    try {
      const form = new FormData()
      form.append('file', uploadedFile)
      form.append('preprocess', 'doc')
      form.append('use_llm_correction', 'false')

      const uploadRes = await fetch(`${DEED_BASE}/upload`, {
        method: 'POST',
        body: form,
      })
      if (!uploadRes.ok) {
        const t = await uploadRes.text()
        throw new Error(t || `업로드 실패 (${uploadRes.status})`)
      }
      const uploadData: UploadResponse = await uploadRes.json()
      setUploadResult(uploadData)

      const riskRes = await fetch(`${DEED_BASE}/documents/${uploadData.document_id}/risk-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!riskRes.ok) {
        const t = await riskRes.text()
        throw new Error(t || `위험 분석 실패 (${riskRes.status})`)
      }
      const riskData: RiskAnalysisResponse = await riskRes.json()
      setRiskFlags(riskData.risk_flags || [])
      setRiskExplanation(riskData.explanation || '')

      // 백엔드에서 6가지 질문별 답변을 받았으면 그걸 사용, 없으면 기존 로직
      if (riskData.check_items && riskData.check_items.length === 6) {
        const items = CHECK_ITEMS_TEMPLATE.map((item, idx) => {
          const checkItem = riskData.check_items![idx]
          return {
            ...item,
            status: checkItem.status as CheckStatus,
            summary: checkItem.summary,
          }
        })
        setCheckResults(items)
      } else {
        // 폴백: 기존 로직 (위험 신호를 순서대로 매핑)
        const flags = riskData.risk_flags || []
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
          ? '등기 분석 서버에 연결할 수 없습니다. deed-service를 실행한 뒤 다시 시도해 주세요. (프로젝트 폴더의 deed-service에서 python main.py, 포트 8001)'
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
              onClick={() => fileInputRef.current?.click()}
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
              onClick={runAnalysis}
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
            <h3 className="text-lg font-bold text-gray-900 mb-3">확인할 6가지 (본질)</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {CHECK_ITEMS_TEMPLATE.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="text-primary-600 font-medium">✓</span>
                  <span className="font-medium">{item.question}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-600">{item.confirmLabel}</span>
                </li>
              ))}
            </ul>
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
              {uploadResult?.image_data_url ? (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={uploadResult.image_data_url}
                    alt="등기부등본"
                    className="w-full max-h-80 object-contain bg-gray-50"
                  />
                </div>
              ) : (
                uploadedFile && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt={uploadedFile.name}
                      className="w-full max-h-80 object-contain bg-gray-50"
                    />
                  </div>
                )
              )}
              {uploadResult?.extracted_text && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">추출된 텍스트 보기</summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 overflow-auto max-h-48 whitespace-pre-wrap">
                    {uploadResult.extracted_text}
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
