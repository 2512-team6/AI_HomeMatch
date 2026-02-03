import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, FileText, Upload } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import SpecialTermsInput from '../components/SpecialTermsInput'

type UploadLocationState = {
  autoOpenFilePicker?: boolean
}

type FileMeta = {
  fileName?: string | null
  mimeType?: string | null
  fileSizeBytes?: number | null
}

export default function ContractReviewUploadPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const consumedAutoOpenRef = useRef(false)
  const [specialTerms, setSpecialTerms] = useState<string[]>([''])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    const state = (location.state as UploadLocationState | null) ?? null
    if (!consumedAutoOpenRef.current && state?.autoOpenFilePicker) {
      consumedAutoOpenRef.current = true
      fileInputRef.current?.click()
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location.pathname, location.search, location.state, navigate])

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
          )}&context=${encodeURIComponent('contract')}&next=${encodeURIComponent(location.pathname)}${options?.returnAction ? `&return=${encodeURIComponent(options.returnAction)}` : ''
          }`
        )
        return false
      }

      const data = (await res.json()) as { hasAll: boolean; missingTypes: string[] }
      if (data.hasAll) return true

      alert(alertMessage)
      navigate(
        `/consents/document?reason=required&types=${encodeURIComponent('DATA_STORE')}&version=${encodeURIComponent(
          'v1.0'
        )}&context=${encodeURIComponent('contract')}&next=${encodeURIComponent(location.pathname)}${options?.returnAction ? `&return=${encodeURIComponent(options.returnAction)}` : ''
        }`
      )
      return false
    } catch {
      alert(alertMessage)
      navigate(
        `/consents/document?reason=required&types=${encodeURIComponent('DATA_STORE')}&version=${encodeURIComponent(
          'v1.0'
        )}&context=${encodeURIComponent('contract')}&next=${encodeURIComponent(location.pathname)}${options?.returnAction ? `&return=${encodeURIComponent(options.returnAction)}` : ''
        }`
      )
      return false
    }
  }

  const openFilePicker = async () => {
    const ok = await ensureDocumentConsent({ returnAction: 'filePicker' })
    if (!ok) return
    fileInputRef.current?.click()
  }

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return ''
    if (bytes < 1024) return `${bytes}B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)}KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(1)}MB`
    const gb = mb / 1024
    return `${gb.toFixed(1)}GB`
  }

  const addFiles = (files: File[]) => {
    if (!files.length) return
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const hasSpecialTerm = useMemo(() => specialTerms.some((v) => v.trim().length > 0), [specialTerms])
  const isAnalyzeDisabled = uploadedFiles.length === 0 && !hasSpecialTerm

  const handleStartAnalyze = () => {
    if (isAnalyzeDisabled) return

    const finalSpecialTerms = specialTerms.map((t) => t.trim()).filter((t) => t !== '')

    // 파일이 없고 특약만 있는 경우는 기존 로직 유지
    if (uploadedFiles.length === 0) {
      const reviewId = Date.now()
      const startedAt = Date.now()
      navigate(`/contract/review/detail?reviewId=${reviewId}`, {
        state: {
          reviewId,
          startedAt,
          specialTerms: finalSpecialTerms,
        },
      })
      return
    }

    const firstFile = uploadedFiles[0]
    const fileMeta: FileMeta | null = firstFile
      ? {
        fileName: firstFile.name ?? null,
        mimeType: firstFile.type ?? null,
        fileSizeBytes: Number.isFinite(firstFile.size) ? firstFile.size : null,
      }
      : null

    navigate(`/contract/review/detail?reviewId=${reviewId}`, {
      state: {
        reviewId,
        startedAt,
        specialTerms: finalSpecialTerms,
        fileMeta,
      },
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setUploadedFiles([])
            navigate('/contract/review')
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
          aria-label="목록으로"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">계약서 업로드</h1>
          <p className="text-sm text-gray-500 mt-1">이미지 또는 PDF를 올리고 점검을 시작하세요.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div
              onClick={() => void openFilePicker()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                void (async () => {
                  const ok = await ensureDocumentConsent()
                  if (!ok) return
                  addFiles(Array.from(e.dataTransfer.files || []))
                })()
              }}
              className={`rounded-2xl border-2 border-dashed p-6 sm:p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'
                }`}
            >
              <Upload className="w-8 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-1">파일을 끌어다 놓거나 선택하세요</p>
              <p className="text-sm text-gray-500 mb-5">JPG/PNG 또는 PDF · 여러 장 업로드 가능</p>
              <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
                파일 선택
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  void (async () => {
                    const ok = await ensureDocumentConsent()
                    if (!ok) return
                    addFiles(Array.from(e.target.files || []))
                  })()
                }}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900">업로드된 파일</h4>
                  <span className="text-xs text-gray-500">{uploadedFiles.length}개</span>
                </div>
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${file.size}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatBytes(file.size)}
                            {file.type ? ` · ${file.type}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-sm font-semibold text-gray-900 mb-1">업로드 팁</div>
              <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                <li>- 글자가 선명한 원본(스캔/PDF)이 정확도가 좋아요.</li>
                <li>- 특약 페이지가 있으면 꼭 포함해 주세요.</li>
                <li>- 주민번호 등 민감정보는 가리는 것을 권장합니다.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900 mb-1">중요 안내</div>
              <p className="text-xs text-amber-900 leading-relaxed">
                본 AI 점검 결과는 법률 자문이 아니며, 정보 제공 목적의 참고 자료입니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <SpecialTermsInput terms={specialTerms} setTerms={setSpecialTerms} />
        </div>

        {uploadError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {uploadError}
          </div>
        )}

        <button
          onClick={handleStartAnalyze}
          disabled={isAnalyzeDisabled || isUploading}
          className="mt-6 w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isUploading ? '업로드 중...' : '분석 시작하기'}
        </button>
      </div>
    </div>
  )
}
