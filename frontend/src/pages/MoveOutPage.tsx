import { Download, Info, FileText, Scale } from 'lucide-react'

export default function MoveOutPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">퇴실 & 분쟁 예방</h1>
      </div>

      {/* Move-in Records */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">입주 기록</h2>
        <p className="text-sm text-gray-600 mb-4">
          입주 시 촬영한 사진과 서류를 확인하고, 새로운 기록을 추가하여 분쟁 발생 시 증거 자료로 활용하세요.
        </p>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            { title: '거실 입주 사진', date: '2023-01-01' },
            { title: '주방 입주 사진', date: '2023-01-01' },
            { title: '욕실 입주 사진', date: '2023-01-01' },
            { title: '계약서 스캔본', date: '2023-01-01' },
          ].map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
              <div className="font-medium text-gray-900 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-600 mb-2">{item.date}</div>
              <button className="w-full flex items-center justify-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Download className="w-4 h-4" />
                <span>다운로드</span>
              </button>
            </div>
          ))}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
            <div className="text-4xl text-gray-400 mb-2">+</div>
            <span className="text-sm text-gray-600">새 기록 추가</span>
          </div>
        </div>
      </div>

      {/* Move-out Preparation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">퇴실 준비</h2>
        <p className="text-sm text-gray-600 mb-4">
          원상복구 체크리스트를 확인하고, 분쟁이 자주 발생하는 항목을 미리 관리하세요.
        </p>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">원상복구 체크리스트</h3>
            <div className="space-y-2">
              {[
                '바닥재 오염 및 파손 점검',
                '붙박이 가구(장롱, 수납장) 기능 점검',
                '창문 및 문들 파손 여부 확인',
                '벽지 손상 여부 확인 및 수리',
              ].map((item, idx) => (
                <label key={idx} className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span className="text-sm text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">분쟁 빈번 항목</h3>
            <div className="space-y-2">
              {['도배/장판 손상', '주방 설비 하자', '벽걸이 TV/액자 흔적'].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                  <span className="text-sm text-gray-700">{item}</span>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">보증금 관리</h2>
        <p className="text-sm text-gray-600 mb-4">
          보증금 반환 진행 상황을 확인하고, 지연 시 대처 방안을 미리 숙지하세요.
        </p>

        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-4">반환 타임라인</h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '66%' }}></div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-bold text-primary-600">퇴실 완료</span>
            <span className="font-bold text-primary-600">정산 완료</span>
            <span>반환 완료</span>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-700 mb-1">현재: 정산 중</div>
            <div className="text-sm text-gray-700">예상 반환일: 2024-08-15</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <Info className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-bold text-gray-900 text-sm mb-1">보증금 반환 의무</h4>
            <p className="text-xs text-gray-600">
              임대인은 퇴실과 동시에 보증금을 반환해야 할 의무가 있습니다.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <FileText className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-bold text-gray-900 text-sm mb-1">내용증명 발송</h4>
            <p className="text-xs text-gray-600">
              지연 시 보증금 반환 요청 내용증명을 발송하여 증거를 확보하세요.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <Scale className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-bold text-gray-900 text-sm mb-1">법적 조치 고려</h4>
            <p className="text-xs text-gray-600">
              내용증명에도 불구하고 반환이 지연되면 지급명령 등 법적 조치를 고려할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-bold text-gray-900 text-sm mb-3">참조 데이터</h4>
          <table className="w-full text-sm">
            <tbody className="space-y-2">
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-700">평균 보증금 반환 기간</td>
                <td className="py-2 text-gray-600">퇴실 후 1개월 이내</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-700">지연 이자율 (법정)</td>
                <td className="py-2 text-gray-600">연 5% (소송 시 연 12%)</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-700">주택임대차보호법 제3조의3</td>
                <td className="py-2 text-gray-600">임차인의 우선변제권 규정</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


