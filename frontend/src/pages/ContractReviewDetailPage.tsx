import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FileText,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Copy,
  FileCheck,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { API_BASE } from '../config'

type FileMeta = {
  fileName?: string | null
  mimeType?: string | null
  fileSizeBytes?: number | null
}

type DetailLocationState = {
  reviewId?: number
  startedAt?: number
  specialTerms: string[]
  fileMeta?: FileMeta | null
  contractAlias?: string
}

type AnswerJson = {
  level?: 'SAFE' | 'NEED_UNDERSTAND' | 'NEED_REVIEW' | 'NEED_FIX' | string
  color?: 'green' | 'yellow' | 'orange' | 'red' | string

  conclusion?: string
  risk_points?: string[]

  laws?: { summary?: string; source_id?: string }[]
  law_ids?: string[]

  precedents?: {
    summary?: string
    source_id?: string
    evidence_paragraphs?: string[]
  }[]
  precedent_ids?: string[]

  mediation_cases?: { summary?: string; source_id?: string }[]
  mediation_case_ids?: string[]

  recommendations?: string[]
}

type ClauseAnalysis = {
  ok: boolean
  answer_raw?: string
  answer_json?: AnswerJson
  parse_error?: boolean
  error_message?: string | null
}

type ApiClauseResult = {
  index: number
  clause: string
  analysis: ClauseAnalysis
}

type CreateContractResponse = { contractId: number }

type ContractLevel = 'SAFE' | 'NEEDS_UNDERSTANDING' | 'NEEDS_REVIEW'

export default function ContractReviewDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const state = (location.state || {}) as Partial<DetailLocationState>
  const reviewId = state.reviewId ?? Number(searchParams.get('reviewId') || 0)
  const specialTerms = Array.isArray(state.specialTerms) ? state.specialTerms : []
  const fileMeta = state.fileMeta ?? null
  const contractAliasFromState = state.contractAlias ?? null

  const [selectedClause, setSelectedClause] = useState(0)

  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [results, setResults] = useState<ApiClauseResult[]>([])

  const [savedContractId, setSavedContractId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const didSaveRef = useRef(false)

  const startedAt = state.startedAt ?? Date.now()
  const [elapsedSec, setElapsedSec] = useState(0)

  const [isCancelling, setIsCancelling] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const didRequestRef = useRef(false)

  const requestContractCheck = async (terms: string[]) => {
    const clauses = terms.map((t) => t.trim()).filter(Boolean)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const TIMEOUT_MS = 90_000
    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException('Request timeout', 'AbortError'))
    }, TIMEOUT_MS)

    const t0 = performance.now()

    try {
      const res = await fetch(`${API_BASE}/api/contract/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauses, strict: false }),
        signal: controller.signal,
      })

      const t1 = performance.now()
      console.log(`[contract/check] headers received: ${Math.round(t1 - t0)}ms`)

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`API 요청 실패 (${res.status}) ${text}`)
      }

      const data = (await res.json()) as ApiClauseResult[]
      const t2 = performance.now()
      console.log(`[contract/check] json parsed: ${Math.round(t2 - t1)}ms (total ${Math.round(t2 - t0)}ms)`)

      return data
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new Error('요청이 취소되었습니다. (타임아웃 또는 사용자 취소)')
      }
      throw e
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const toContractLevel = (lv?: string): ContractLevel => {
    if (lv === 'SAFE') return 'SAFE'
    if (lv === 'NEED_UNDERSTAND') return 'NEEDS_UNDERSTANDING'
    // NEED_REVIEW / NEED_FIX / unknown -> 일단 NEEDS_REVIEW로 저장(인수문서 레벨 기준)
    return 'NEEDS_REVIEW'
  }

  // ✅ 저장 API: contracts 생성 (camelCase DTO)
  const createContract = async (payload: {
    contractAlias: string
    specialTermCount: number
    fileName?: string | null
    mimeType?: string | null
    fileSizeBytes?: number | null
  }) => {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('로그인이 필요합니다.')

    const res = await fetch(`${API_BASE}/api/contracts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 401) throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.')
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`계약서 저장 실패 (${res.status}) ${text}`)
    }

    return (await res.json()) as CreateContractResponse
  }

  // ✅ 저장 API: clause_analysis_results bulk 저장 (camelCase DTO)
  const saveClauseResultsBulk = async (contractId: number, rows: ApiClauseResult[]) => {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('로그인이 필요합니다.')

    const payloadRows = rows.map((r) => {
      const aj = r.analysis?.answer_json

      const mediationSummaries = (aj?.mediation_cases ?? []).map((m) => m.summary ?? '').filter(Boolean)
      const mediationCaseIds =
        (aj?.mediation_case_ids ?? (aj?.mediation_cases ?? []).map((m) => m.source_id)).filter(Boolean) as string[]

      const precedentSummaries = (aj?.precedents ?? []).map((p) => p.summary ?? '').filter(Boolean)
      const precedentCaseIds =
        (aj?.precedent_ids ?? (aj?.precedents ?? []).map((p) => p.source_id)).filter(Boolean) as string[]
      const precedentEvidence = (aj?.precedents ?? [])
        .flatMap((p) => p.evidence_paragraphs ?? [])
        .filter((x): x is string => typeof x === 'string' && x.trim() !== '')

      const lawSummaries = (aj?.laws ?? []).map((l) => l.summary ?? '').filter(Boolean)
      const lawIds = (aj?.law_ids ?? (aj?.laws ?? []).map((l) => l.source_id)).filter(Boolean) as string[]

      return {
        clauseIndex: r.index ?? 0,
        clauseText: (r.clause != null && String(r.clause).trim() !== '') ? String(r.clause) : '',
        level: toContractLevel(aj?.level),
        conclusion: aj?.conclusion ?? null,

        riskPoints: aj?.risk_points ?? null,

        mediationSummaries,
        mediationCaseIds,

        precedentSummaries,
        precedentCaseIds,
        precedentEvidence,

        lawSummaries,
        lawIds,

        recommendedClauseText: (aj?.recommendations ?? []).join('\n') || null,
      }
    })

    const res = await fetch(`${API_BASE}/api/contracts/${contractId}/clause-analysis-results:bulk`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rows: payloadRows }),
    })

    if (res.status === 401) throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.')
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`분석 결과 저장 실패 (${res.status}) ${text}`)
    }
  }

  const autoSaveAfterAnalysis = async (analysisResults: ApiClauseResult[]) => {
    if (didSaveRef.current) return
    didSaveRef.current = true

    try {
      setSaving(true)
      setSaveError(null)

      const contractAlias = (contractAliasFromState?.trim() || `계약서_${reviewId || Date.now()}`)
      const specialTermCount = analysisResults.length

      const { contractId } = await createContract({
        contractAlias,
        specialTermCount,
        fileName: fileMeta?.fileName ?? null,
        mimeType: fileMeta?.mimeType ?? null,
        fileSizeBytes: fileMeta?.fileSizeBytes ?? null,
      })

      await saveClauseResultsBulk(contractId, analysisResults)
      setSavedContractId(contractId)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장 중 오류')
      // 재시도 버튼 만들 계획이면 아래 주석 해제
      // didSaveRef.current = false
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!loading) return

    const tick = () => {
      const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
      setElapsedSec(sec)
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [loading, startedAt])

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    if (m <= 0) return `${s}초`
    return `${m}분 ${s}초`
  }

  const levelLabel = (lv?: string) => {
    switch (lv) {
      case 'SAFE':
        return '안전'
      case 'NEED_UNDERSTAND':
        return '이해 필요'
      case 'NEED_REVIEW':
        return '검토 필요'
      case 'NEED_FIX':
        return '수정 필요'
      default:
        return lv ?? '판단'
    }
  }

  const levelClass = (c?: string) => {
    switch (c) {
      case 'green':
        return 'bg-green-50 text-green-700 border border-green-100'
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-100'
      case 'orange':
        return 'bg-orange-50 text-orange-700 border border-orange-100'
      case 'red':
        return 'bg-red-50 text-red-700 border border-red-100'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  useEffect(() => {
    if (didRequestRef.current) return
    didRequestRef.current = true

    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setApiError(null)

        const cleaned = specialTerms.map((t) => t.trim()).filter(Boolean)
        if (cleaned.length === 0) {
          throw new Error('특약사항이 없습니다. 이전 화면에서 특약을 입력해 주세요.')
        }

        const data = await requestContractCheck(cleaned)
        console.log('[contract/check response]', data)

        if (!cancelled) {
          const arr = Array.isArray(data) ? data : []
          setResults(arr)
          setSelectedClause(0)

          const hasAnyParseError = arr.some((r) => r.analysis?.parse_error)
          if (!hasAnyParseError && arr.length > 0) {
            void autoSaveAfterAnalysis(arr)
          } else {
            didSaveRef.current = true
          }
        }
      } catch (e) {
        console.error('[contract/check error]', e)
        if (!cancelled) {
          setResults([])
          setApiError(e instanceof Error ? e.message : '분석 요청 중 오류')
        }
      } finally {
        if (!cancelled) setLoading(false)
        if (!cancelled) setIsCancelling(false)
      }
    }

    run()

    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs = useMemo(() => {
    if (results.length > 0) {
      return results.map((r) => ({
        id: r.index,
        title: `특약 ${r.index + 1}`,
        clause: r.clause,
      }))
    }
    return [{ id: 0, title: '특약 1', clause: '' }]
  }, [results])

  const cancelRequest = () => {
    setIsCancelling(true)
    abortRef.current?.abort()
    setApiError('사용자가 분석을 취소했습니다.')
    setResults([])
    setLoading(false)
    setIsCancelling(false)
  }

  const current = results[selectedClause]
  const analysis = current?.analysis
  const answer = analysis?.answer_json

  const safeTitle = current ? `특약 ${current.index + 1}` : tabs[selectedClause]?.title ?? '특약'
  const safeClauseText = current?.clause ?? ''
  const safeOriginal = safeClauseText || '특약 원문이 없습니다.'

  const safeConclusion =
    !analysis
      ? '분석 결과가 없습니다.'
      : analysis.parse_error
        ? `분석 결과 파싱 실패: ${analysis.error_message ?? '알 수 없는 오류'}`
        : answer?.conclusion ?? '분석 결론이 없습니다.'

  const safeRisks = answer?.risk_points ?? []
  const safeLaw = answer?.laws ?? []
  const safePrec = answer?.precedents ?? []
  const safeMed = answer?.mediation_cases ?? []
  const safeRecommendations = answer?.recommendations ?? []

  const level = answer?.level
  const color = answer?.color

  return (
    <>
      {loading ? (
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
            <div className="text-sm">
              <div className="font-semibold text-gray-900">분석중...</div>
              <div className="text-gray-500">경과시간: {formatElapsed(elapsedSec)}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                {elapsedSec >= 30 && '서버에서 AI 분석이 지연되고 있습니다. 잠시만 기다리거나 취소할 수 있어요.'}
                {elapsedSec >= 90 && '오래 걸리면 네트워크/서버 문제일 수 있습니다. 취소 후 다시 시도해보세요.'}
              </div>
              <button
                type="button"
                onClick={cancelRequest}
                disabled={isCancelling}
                className="ml-4 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {isCancelling ? '취소 중...' : '분석 취소'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/contract/review')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">계약서 상세 분석 결과</h1>
                <p className="text-sm text-gray-500 mt-1">
                  특약별로 핵심 결론, 리스크, 법·판례·분쟁 근거를 한 번에 확인하세요.
                  {reviewId ? <span className="ml-2 text-xs text-gray-400">({reviewId}번 분석)</span> : null}
                </p>

                <div className="mt-2 text-xs text-gray-500">
                  {saving && <span>저장 중...</span>}
                  {!saving && savedContractId && <span>저장 완료: 계약서 ID {savedContractId}</span>}
                  {!saving && saveError && <span className="text-red-600">저장 실패: {saveError}</span>}
                </div>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
              분석을 불러오지 못했습니다: {apiError}
            </div>
          )}

          <div className="space-y-6 mt-0">
            <div>
              <div className="flex gap-1 bg-gray-50">
                {tabs.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedClause(idx)}
                    disabled={results.length === 0}
                    className={`px-4 py-2 text-sm rounded-t-lg transition-all ${selectedClause === idx
                      ? 'bg-white border border-gray-300 border-b-white text-gray-900 font-semibold'
                      : 'text-gray-500 border border-gray-200 bg-white hover:text-gray-700'
                      } ${results.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-gray-200 rounded-b-xl border-t-0">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${levelClass(color)}`}>
                        <Lightbulb className="w-3.5 h-3.5" />
                        AI 종합 판단: {levelLabel(level)}
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-gray-900">{safeTitle}</h2>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-gray-800">{safeConclusion}</p>

                  <div className="mt-4 rounded-md bg-red-50 px-3 py-2 border border-red-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-100">
                        중요 안내
                      </span>
                      <span className="text-[11px] font-medium text-red-800">면책 고지</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-red-800">
                      본 AI 점검 결과는 법률 자문이 아니며, 정보 제공 목적의 참고 자료입니다. 정확한 법률 판단이 필요하다면 반드시 전문가와 상담하세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 원문 & 권장 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-semibold text-gray-900">선택 특약 원문</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {safeOriginal}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600" />
                    <h3 className="text-sm font-semibold text-gray-900">권장 수정/보완</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText((safeRecommendations ?? []).join('\n'))}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>복사</span>
                  </button>
                </div>

                {safeRecommendations.length > 0 ? (
                  <ul className="bg-gray-50 rounded-lg p-3 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed space-y-2">
                    {safeRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                    권장 내용이 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 리스크 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-gray-900">주요 리스크 포인트</h3>
              </div>

              {safeRisks.length > 0 ? (
                <ul className="mt-1 space-y-2 text-sm text-gray-800">
                  {safeRisks.map((risk, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">표시할 리스크 포인트가 없습니다.</div>
              )}
            </div>

            {/* 법·판례·분쟁 */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-1">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">법령 근거</h3>
                {safeLaw.length > 0 ? (
                  <ul className="space-y-2 text-xs text-gray-800">
                    {safeLaw.map((law, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <div className="text-gray-800">{law.summary || '—'}</div>
                        {law.source_id && <div className="mt-1 text-[11px] text-gray-500">{law.source_id}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500">표시할 법령 근거가 없습니다.</div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-1">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">판례 근거</h3>
                {safePrec.length > 0 ? (
                  <ul className="space-y-3 text-xs text-gray-800">
                    {safePrec.map((p, idx) => (
                      <li key={idx} className="space-y-1 leading-relaxed">
                        <div className="font-medium text-gray-900">{p.summary || '—'}</div>
                        {p.source_id && <div className="text-[11px] text-gray-500">{p.source_id}</div>}
                        {(p.evidence_paragraphs?.length ?? 0) > 0 && (
                          <div className="mt-2 rounded-md bg-gray-50 border border-gray-100 p-2 text-[11px] text-gray-700 whitespace-pre-wrap">
                            {p.evidence_paragraphs!.join('\n\n')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500">표시할 판례 근거가 없습니다.</div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-1">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">분쟁조정사례 요약</h3>
                {safeMed.length > 0 ? (
                  <ul className="space-y-2 text-xs text-gray-800">
                    {safeMed.map((m, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <div className="text-gray-800">{m.summary || '—'}</div>
                        {m.source_id && <div className="mt-1 text-[11px] text-gray-500">{m.source_id}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500">표시할 분쟁조정사례가 없습니다.</div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white border border-primary-200 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                    <FileCheck className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">다음 단계: 등기부등본 분석으로 이어가기</h3>
                    <p className="mt-1 text-xs text-gray-600">소유자 일치, 근저당·가압류, 공동 소유 등 핵심 6가지를 한 번에 점검하세요.</p>
                  </div>
                </div>
                <Link
                  to="/contract/deed"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  등기부등본 분석하기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
