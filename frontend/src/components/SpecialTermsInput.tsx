import { Dispatch, KeyboardEvent, SetStateAction, useEffect, useRef } from 'react'

type SpecialTermsInputProps = {
  terms: string[]
  setTerms: Dispatch<SetStateAction<string[]>>
}

const isBlank = (value: string) => value.trim() === ''

// 항상 "마지막 줄에 빈 인풋 1개"만 유지하도록 정규화
const normalizeTerms = (raw: string[]) => {
  const filled = raw.filter((t) => !isBlank(t))
  return filled.length > 0 ? [...filled, ''] : ['']
}

export default function SpecialTermsInput({ terms, setTerms }: SpecialTermsInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const pendingFocusIndexRef = useRef<number | null>(null)

  // 새 인풋이 생성/재정렬된 뒤 포커스 이동
  useEffect(() => {
    const idx = pendingFocusIndexRef.current
    if (idx === null) return
    pendingFocusIndexRef.current = null
    requestAnimationFrame(() => {
      inputRefs.current[idx]?.focus()
    })
  }, [terms])

  const handleChange = (idx: number, nextValue: string) => {
    setTerms((prev) => {
      const next = [...prev]
      next[idx] = nextValue

      // 중간 줄이 비워지면(빈 문자열/공백) 자동 삭제로 정렬 유지 (빈 인풋 중복 방지)
      if (idx < next.length - 1 && isBlank(nextValue)) {
        next.splice(idx, 1)
        const normalized = normalizeTerms(next)
        pendingFocusIndexRef.current = Math.min(idx, normalized.length - 1)
        return normalized
      }

      // 마지막 줄 입력 시 자동으로 다음 빈 인풋을 1개만 유지
      return normalizeTerms(next)
    })
  }

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault() // 줄바꿈/폼 submit 방지 (Enter = 다음 항목)

    setTerms((prev) => {
      // 마지막 인풋이 비어있으면 더 생성하지 않음 (빈 인풋 중복 방지)
      const isLast = idx === prev.length - 1
      if (isLast && isBlank(prev[idx] ?? '')) return prev

      // 다음 인풋이 이미 있으면 이동, 없으면 생성 후 이동
      if (idx < prev.length - 1) {
        pendingFocusIndexRef.current = idx + 1
        return prev
      }

      pendingFocusIndexRef.current = idx + 1
      return [...prev, '']
    })
  }

  const handleDelete = (idx: number) => {
    setTerms((prev) => {
      if (prev.length <= 1) return prev // 인풋이 1개만 남으면 삭제 비활성화

      // 마지막 줄(빈 인풋)만 남기기 위해, 삭제 후에도 정규화
      const next = prev.filter((_, i) => i !== idx)
      const normalized = normalizeTerms(next)
      pendingFocusIndexRef.current = Math.min(idx, normalized.length - 1)
      return normalized
    })
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">특약 입력</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Enter 키로 다음 항목으로 이동합니다. 입력하지 않은(빈) 항목은 저장 대상에서 제외됩니다.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {terms.map((value, idx) => {
          const deleteDisabled = terms.length <= 1
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-16 flex-shrink-0 text-sm font-semibold text-gray-700">{`특약 ${idx + 1}`}</div>
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                value={value}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                placeholder={idx === terms.length - 1 ? '특약 내용을 입력하세요' : ''}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => handleDelete(idx)}
                disabled={deleteDisabled}
                aria-label={`${idx + 1}번 특약 삭제`}
                className="h-10 w-10 rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

