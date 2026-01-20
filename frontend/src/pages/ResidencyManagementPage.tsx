import { Upload } from 'lucide-react'

export default function ResidencyManagementPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">거주 중 관리</h1>
        <p className="text-gray-600">
          거주 중 발생하는 하자 관리, 주거비 납부 추적, 입주 시점 기록 확인을 통해 편리하게 주거 생활을 관리하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Defect Management */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">하자 관리</h2>
            <p className="text-sm text-gray-600 mb-4">
              하자 사진을 업로드하고 AI로 분류하며, 임대인에게 보낼 문서를 자동 생성합니다.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">사진을 드래그하거나 클릭하여 업로드</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">최근 하자 접수 내역</h2>
            <div className="space-y-4">
              {[
                { title: '침대 프레임 파손', date: '2023-10-26', status: '처리 중', color: 'yellow' },
                { title: '화장실 타일 금', date: '2023-10-20', status: '접수 완료', color: 'blue' },
                { title: '창문 틈새 바람', date: '2023-10-15', status: '처리 완료', color: 'green' },
                { title: '싱크대 배수구 막힘', date: '2023-09-30', status: '거절', color: 'red' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.date}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-${item.color}-100 text-${item.color}-800`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              임대인 요청 문서 생성
            </button>
          </div>
        </div>

        {/* Right Column - Cost Management */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">주거비 관리</h2>
            <p className="text-sm text-gray-600 mb-4">
              월세 및 공과금 납부 내역을 추적하고 예상 비용을 안내합니다.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">11월 주거비 달력</h3>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`text-center py-2 rounded ${
                    day === 5 || day === 20
                      ? 'bg-primary-100 text-primary-700 font-bold'
                      : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600">● 표시된 날짜는 납부 예정일입니다.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">11월 예상 주거비</h3>
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
                <span className="font-bold text-gray-900">총 예상 금액</span>
                <span className="font-bold text-primary-600">~1,430,000원</span>
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              지난 주거비 내역 보기
            </button>
          </div>
        </div>
      </div>

      {/* Entry Point Defect Records */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">입주 시점 하자 기록</h2>
        <p className="text-sm text-gray-600 mb-4">
          입주 시점의 하자 기록을 확인하여 퇴실 시 분쟁을 예방하세요.
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { title: '입구 문 손잡이 긁힘', date: '2023-09-01' },
            { title: '거실 벽지 미세한 오염', date: '2023-09-01' },
            { title: '주방 후드 작동 불량', date: '2023-09-01' },
            { title: '작은 방 창문 잠금 뻑뻑함', date: '2023-09-01' },
          ].map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
              <div className="font-medium text-gray-900 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-600">{item.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


