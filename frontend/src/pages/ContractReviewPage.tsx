import { useEffect } from 'react'
import { AlertTriangle, CheckCircle, ChevronRight, FileCheck, FileText, Lightbulb, Plus, Upload } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export default function ContractReviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // (기존 링크 호환) /contract/review?reviewId=123 형태로 들어오면 상세 페이지로 이동
  useEffect(() => {
    const reviewId = searchParams.get('reviewId')
    if (!reviewId) return
    const id = parseInt(reviewId)
    if (Number.isNaN(id)) return
    navigate(`/contract/review/detail?reviewId=${id}`, { replace: true })
  }, [searchParams, navigate])

  // 지난 점검 목록 데이터 (계약 유형·주소·당사자 등 식별 정보 포함)
  const reviewList = [
    {
      id: 1,
      type: '전세',
      address: '서울시 강남구 테헤란로 123',
      lessor: '김○○',
      lessee: '이○○',
      date: '2024-01-15',
      deposit: '3억 5천만 원',
      period: '2024.01.15 ~ 2025.01.14',
      area: '전용 84㎡',
      purpose: '주거용',
      status: '완료',
      clauses: 3,
    },
    {
      id: 2,
      type: '월세',
      address: '서울시 서초구 반포대로 456',
      lessor: '박○○',
      lessee: '최○○',
      date: '2024-01-10',
      deposit: '5천만 원 / 50만 원',
      period: '2024.01.10 ~ 2025.01.09',
      area: '전용 59㎡',
      purpose: '주거용',
      status: '완료',
      clauses: 5,
    },
    {
      id: 3,
      type: '전세',
      address: '서울시 송파구 잠실로 789',
      lessor: '정○○',
      lessee: '한○○',
      date: '2024-01-05',
      deposit: '2억 2천만 원',
      period: '2024.01.05 ~ 2025.01.04',
      area: '전용 72㎡',
      purpose: '주거용',
      status: '완료',
      clauses: 2,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">계약서 점검</h1>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                계약서(이미지/PDF)를 올리면 AI가 특약을 정리하고, 위험 포인트와 권장 문구를 한눈에 보여드려요.
              </p>
            </div>
          </div>

          <Link
            to="/contract/review/upload"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            새 점검 시작
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              놓치기 쉬운 리스크
            </div>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              보증금 반환, 수리비 공제, 중도해지 등 분쟁 포인트를 먼저 체크합니다.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              권장 문구까지 바로
            </div>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              모호한 문장을 더 안전한 표현으로 바꿀 수 있도록 예시 문구를 제공합니다.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Lightbulb className="w-4 h-4 text-primary-600" />
              근거와 함께 이해
            </div>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              법령/판례/분쟁조정사례 기반으로 “왜 위험한지”를 쉽게 설명합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 지난 점검 목록 */}
      {reviewList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviewList.map((review) => (
            <Link
              key={review.id}
              to={`/contract/review/detail?reviewId=${review.id}`}
              className="group text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                      {review.type}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {review.status}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-gray-900 leading-snug">{review.address}</h3>
                  <p className="mt-1 text-xs text-gray-500">점검일 {review.date}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors mt-1 flex-shrink-0" />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <FileCheck className="w-4 h-4 text-primary-600" />
                  특약 {review.clauses}개 분석
                </span>
                <span className="font-semibold text-primary-700">결과 보기</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center">
          <FileText className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-1">아직 점검한 계약서가 없습니다.</p>
          <p className="text-sm text-gray-500 mb-5">첫 점검을 시작해서 위험 조항을 미리 확인해보세요.</p>
          <Link
            to="/contract/review/upload"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Upload className="w-4 h-4" />
            첫 계약서 업로드하기
          </Link>
        </div>
      )}
    </div>
  )
}


