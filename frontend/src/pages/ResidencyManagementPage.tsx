import { Upload } from 'lucide-react'

export default function ResidencyManagementPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">거주 중 관리</h1>
        <p className="text-gray-600">
          거주 중 발생하는 하자 관리, 주거비 납부 추적, 퇴실 준비까지 한 번에 관리하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Defect Management */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">하자 관리</h2>
            <p className="text-sm text-gray-600 mb-4">
              하자 사진을 업로드하면 AI가 자동 분류하고,
              임대인에게 보낼 요청 문서를 생성해드려요.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                사진을 드래그하거나 클릭하여 업로드
              </p>
            </div>
          </div>

        
        {/* Payment Risk */}
<div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
  <h2 className="text-xl font-bold text-gray-900 mb-2">
    주거비 연체 리스크
  </h2>
  <p className="text-sm text-gray-600 mb-4">
    계약 조건 기준으로 불이익 가능성을 미리 알려드려요.
  </p>

  {/* Payment Status */}
  <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-white">
    <div className="text-sm font-medium text-gray-900 mb-3">
      이번 달 납부 상태
    </div>

    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">월세</span>
        <span className="font-medium text-red-600">미납</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-600">관리비</span>
        <span className="font-medium text-green-600">납부 완료</span>
      </div>

      <div className="flex justify-between pt-2 border-t border-gray-100">
        <span className="text-gray-600">다음 납부일까지</span>
        <span className="font-bold text-gray-900">
          3일 남음
        </span>
      </div>
    </div>
  </div>

  {/* Risk Alert */}
  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
    <div className="text-sm font-bold text-yellow-800 mb-1">
      ⚠ 이번 달 월세 주의
    </div>
    <p className="text-sm text-yellow-700">
      납부일로부터 <b>3일 이상 지연</b> 시<br />
      계약서상 연체이자가 발생할 수 있어요.
    </p>
  </div>

  <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
    계약서 기준 자세히 보기
  </button>
</div>


        </div>

        {/* Right Column */}
        <div className="space-y-6">
       

          {/* Calendar */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              11월 주거비 달력

            </h3>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-700 py-2"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <div
  key={day}
  className={`text-center py-4 min-h-[48px] rounded ${
    day === 5 || day === 20
      ? 'bg-primary-100 text-primary-700 font-bold'
      : 'text-gray-700'
  }`}
>
  {day}
</div>

              ))}
            </div>
            <p className="text-xs text-gray-600">
              ● 표시된 날짜는 납부 예정일입니다.
            </p>
          </div>

          {/* Estimated Cost */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              11월 예상 주거비
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">월세</span>
                <span className="font-bold">1,200,000원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">관리비</span>
                <span className="font-bold">150,000원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">전기/수도/가스</span>
                <span className="font-bold">~80,000원</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">
                  총 예상 금액
                </span>
                <span className="font-bold text-primary-600">
                  ~1,430,000원
                </span>
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              지난 주거비 내역 보기
            </button>
          </div>
        </div>
      </div>

      {/* Entry Defect Records */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          입주 시점 하자 기록
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          입주 당시 하자를 보관해 퇴실 시 분쟁을 예방하세요.
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { title: '입구 문 손잡이 긁힘', date: '2023-09-01' },
            { title: '거실 벽지 미세한 오염', date: '2023-09-01' },
            { title: '주방 후드 작동 불량', date: '2023-09-01' },
            { title: '작은 방 창문 잠금 뻑뻑함', date: '2023-09-01' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
              <div className="font-medium text-gray-900 text-sm mb-1">
                {item.title}
              </div>
              <div className="text-xs text-gray-600">
                {item.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
