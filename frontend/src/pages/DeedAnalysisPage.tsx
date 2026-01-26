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
} from 'lucide-react'

type CheckStatus = 'ok' | 'caution' | 'danger' | 'pending'

interface CheckItem {
  id: number
  question: string
  confirmLabel: string
  status: CheckStatus
  summary: string
}

const CHECK_ITEMS: CheckItem[] = [
  {
    id: 1,
    question: '이 사람이 진짜 주인인가?',
    confirmLabel: '소유자 일치 여부',
    status: 'ok',
    summary: '등기부상 소유자와 계약상 임대인이 일치합니다.',
  },
  {
    id: 2,
    question: '보증금보다 먼저 가져갈 권리가 있는가?',
    confirmLabel: '근저당·가압류 등 권리 존재',
    status: 'caution',
    summary: '근저당권 1건(채무최고액 2억 5천만 원) 존재. 보증금 회수 순위 확인 필요.',
  },
  {
    id: 3,
    question: '이 집, 왜 이렇게 최근에 손바뀜 됐지?',
    confirmLabel: '소유권 이전 시점',
    status: 'ok',
    summary: '2022년 3월 소유권 이전. 약 2년 경과로 충분한 거주 이력으로 보입니다.',
  },
  {
    id: 4,
    question: '나 말고 계약 권한 있는 사람이 또 있나?',
    confirmLabel: '공동 소유 여부',
    status: 'ok',
    summary: '단독 소유입니다. 공동 소유자 동의 없이 계약한 위험은 없습니다.',
  },
  {
    id: 5,
    question: '내 보증금은 몇 번째 순서인가?',
    confirmLabel: '선순위 권리 구조',
    status: 'caution',
    summary: '선순위 전세권(1억) → 근저당권(2.5억) → 임차인 보증금. 경매 시 회수 순위 확인 권장.',
  },
  {
    id: 6,
    question: '이 계약, 법적으로 특정이 되는가?',
    confirmLabel: '호실·목적물 특정 가능 여부',
    status: 'ok',
    summary: '동·호수, 전용면적 등이 등기부와 일치하여 목적물 특정 가능합니다.',
  },
]

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

export default function DeedAnalysisPage() {
  const [view, setView] = useState<'upload' | 'result'>('upload')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [checkResults, setCheckResults] = useState<CheckItem[]>(CHECK_ITEMS)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const runAnalysis = () => {
    if (uploadedFiles.length === 0) return
    setIsAnalyzing(true)
    // Simulate OCR+LLM analysis delay
    setTimeout(() => {
      setIsAnalyzing(false)
      setView('result')
    }, 1500)
  }

  const reset = () => {
    setView('upload')
    setUploadedFiles([])
    setCheckResults(CHECK_ITEMS)
  }

  return (
    <div className="space-y-6">
      {view === 'upload' && (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">등기부등본 분석</h1>
            <p className="text-gray-600">
              등기부등본을 업로드하면, 사람들이 실제로 확인하고 싶은 6가지를 AI가 요약해 드립니다.
              처음부터 끝까지 읽지 않아도 핵심만 빠르게 파악하세요.
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">등기부등본 이미지 업로드</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-gray-50/50 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">등기부등본 이미지를 업로드하세요</p>
              <p className="text-sm text-gray-500 mb-4">JPG, PNG 등 이미지 파일 지원 (추후 OCR + LLM 분석)</p>
              <button
                type="button"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                파일 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">업로드된 파일 ({uploadedFiles.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="relative border border-gray-200 rounded-lg overflow-hidden group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-28 object-cover"
                      />
                      <p className="p-2 text-xs text-gray-600 truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={runAnalysis}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              className="mt-6 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? '분석 중…' : '등기부등본 분석 시작'}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">확인할 6가지 (본질)</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {CHECK_ITEMS.map((item) => (
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
            {/* Left: 등기부등본 이미지 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">등기부등본</h2>
              <div className="space-y-3">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-40 object-contain bg-gray-50"
                    />
                    <p className="p-2 text-xs text-gray-600 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: 6가지 확인 결과 */}
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
                  <p className="text-sm text-gray-700">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 다음 단계 */}
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
              to="/contract/discrepancy"
              className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">계약서 검증</h3>
                  <p className="text-sm text-gray-600">중개사 설명 vs 계약서 불일치</p>
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
