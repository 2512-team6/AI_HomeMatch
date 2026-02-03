import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

type ConsentStatusResponse = {
  hasAll: boolean
  missingTypes: string[]
}

const DEFAULT_VERSION = 'v1.0'
const DEFAULT_TYPES = ['DATA_STORE']

function getAccessToken() {
  return localStorage.getItem('accessToken')
}

export default function DocumentConsentPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyAgreed, setAlreadyAgreed] = useState(false)

  const next = params.get('next') || '/home'
  const context = params.get('context') || 'document'
  const returnAction = params.get('return') || ''
  const reason = params.get('reason') || ''
  const preview = params.get('preview') === '1' || params.get('preview') === 'true'
  const version = params.get('version') || DEFAULT_VERSION
  const rawTypes = params.get('types') || ''

  const types = useMemo(() => {
    if (!rawTypes) return DEFAULT_TYPES
    const parsed = rawTypes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return parsed.length ? parsed : DEFAULT_TYPES
  }, [rawTypes])

  const typesKey = useMemo(() => types.join(','), [types])

  const consentContent = useMemo(() => {
    return [
      '문서(파일) 저장 및 분석 처리 동의',
      '',
      "Home'Scan은 계약서 및 등기부등본(이미지/PDF) 업로드 및 분석 기능을 제공하며, 업로드된 문서는 아래 목적과 범위 내에서 처리·저장됩니다.",
      '',
      '1. 처리 목적',
      '- 계약서 및 등기부등본 OCR 및 분석 결과 제공',
      '- 서비스 품질 개선 및 오류 대응 (익명 처리)',
      '',
      '2. 처리 및 저장 범위',
      '- 업로드한 문서 파일(이미지/PDF)',
      '- 문서 분석 과정에서 추출된 텍스트 정보',
      '',
      '3. 보관 및 삭제',
      "- 문서 보관 및 삭제는 ‘문서 삭제/보관 설정’ 메뉴에서 직접 관리할 수 있습니다.",
      '',
      '4. 유의사항',
      '- 주민등록번호 등 민감한 개인정보가 포함된 문서는 업로드 전 가림 처리를 권장드립니다.',
      '',
      '동의하지 않을 경우 문서 업로드 및 분석 기능을 이용하실 수 없습니다.',
    ].join('\n')
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    const check = async () => {
      setIsChecking(true)
      setError(null)
      setAlreadyAgreed(false)
      try {
        const res = await fetch(
          `http://localhost:8080/api/consents/required?types=${encodeURIComponent(
            typesKey
          )}&version=${encodeURIComponent(version)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (res.status === 401) {
          navigate('/login')
          return
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          setError(txt || `동의 상태 확인 실패 (HTTP ${res.status})`)
          return
        }

        const data = (await res.json()) as ConsentStatusResponse
        if (data.hasAll) {
          if (reason === 'required' && !preview) {
            navigate(next, {
              replace: true,
              state: {
                consentJustAgreed: false,
                consentContext: context,
                autoOpenFilePicker: returnAction === 'filePicker',
              },
            })
            return
          }
          setAlreadyAgreed(true)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '동의 상태 확인에 실패했습니다.'
        setError(
          msg === 'Failed to fetch' || msg.toLowerCase().includes('fetch')
            ? '동의 상태 확인 서버에 연결할 수 없습니다. backend(8080)를 실행한 뒤 다시 시도해 주세요.'
            : msg
        )
      } finally {
        setIsChecking(false)
      }
    }

    void check()
  }, [navigate, next, reason, typesKey, version])

  const handleAgree = async () => {
    if (!agree) {
      alert('필수 동의 체크 후 진행해 주세요.')
      return
    }

    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      for (const t of types) {
        const res = await fetch('http://localhost:8080/api/consents/agree', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            consentType: t,
            consentContent,
            version,
          }),
        })

        if (res.status === 401) {
          navigate('/login')
          return
        }

        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`동의 저장 실패 (HTTP ${res.status})${txt ? `: ${txt}` : ''}`)
        }
      }

      navigate(next, {
        state: {
          consentJustAgreed: true,
          consentContext: context,
          autoOpenFilePicker: returnAction === 'filePicker',
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '동의 저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border rounded-xl p-6">
          <p className="text-gray-700">동의 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            문서 저장 및 분석 처리 동의
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            계약서 및 등기부등본 업로드·분석 기능을 이용하려면 동의가 필요합니다.
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        {reason === 'required' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            문서 업로드/분석을 진행하려면 먼저{' '}
            <span className="font-semibold">문서 저장 및 분석 처리 동의</span>가 필요합니다.
          </div>
        )}

        {alreadyAgreed && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            현재 <span className="font-semibold">동의 완료</span> 상태입니다. 아래에서 동의 내용을 확인할 수 있습니다.
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl bg-primary-50 border p-4">
          <ShieldCheck className="w-5 h-5 text-primary-700 mt-0.5" />
          <div className="text-sm text-primary-900">
            <p className="font-semibold mb-1">필수 동의</p>
            <p>
              동의하지 않을 경우 문서 업로드 및 분석 기능을 이용하실 수 없습니다.
              <br />
              (유형: {types.join(', ')} / 버전: {version})
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">동의 내용</p>

          {/* 글씨체/가독성만 개선 */}
          <pre
            className="
              whitespace-pre-wrap
              font-sans
              font-normal
              text-[10px]
              text-gray-800
              leading-7
            "
          >
            {consentContent}
          </pre>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={alreadyAgreed ? true : agree}
            disabled={alreadyAgreed}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            위 내용을 확인했으며, 문서(파일) 저장 및 분석 처리에 동의합니다. (필수)
          </span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleAgree}
          disabled={isSubmitting || alreadyAgreed}
          className="w-full rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {alreadyAgreed ? '현재 버전 동의 완료' : isSubmitting ? '저장 중...' : '동의하고 계속하기'}
        </button>
      </div>
    </div>
  )
}
