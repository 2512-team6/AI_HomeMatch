import { AlertTriangle, FileText, Shield } from 'lucide-react'

export default function ContractDiscrepancyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          중개사 설명 vs 계약서 불일치 분석
        </h1>
        <p className="text-gray-600">
          중개사의 설명과 실제 계약서 내용 간의 차이를 확인하고, 잠재적인 위험을 파악하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">제공된 중개사 설명</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            부동산 중개인은 구두로 '해당 건물은 전세권 설정이 되어 있지 않으며, 대출금액이 적어 안전하다'고 설명했습니다. 또한, 건물주가 직접 거주하며 관리하고 있어 문제가 발생할 가능성이 매우 낮다고 강조했습니다.
          </div>
        </div>

        {/* Center Panel - Warning */}
        <div className="bg-white border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
            <h2 className="text-lg font-bold text-red-900">
              중개사 설명과 계약서 내용이 심각하게 불일치
            </h2>
          </div>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              중개사는 전세권이 없으며 대출금액이 적어 안전하다고 설명했으나, 계약서에는 선순위 전세권과 2억 5천만 원의 근저당권이 명시되어 있습니다.
            </p>
            <p>
              이는 임차인의 보증금 회수에 중대한 위험을 초래할 수 있습니다. 특히 선순위 전세권과 근저당권은 임차인의 보증금보다 우선하여 변제받을 수 있어, 경매 시 보증금 회수가 어려울 수 있습니다.
            </p>
            <p className="font-bold mt-4">
              중개사에게 불일치 사항에 대한 명확한 설명을 요구하고, 계약 진행을 전면 재검토하거나 법률 전문가와 상담하세요.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">관련 계약서 조항</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            본 계약 체결 전 확인된 등기부등본에 따르면, 해당 건물에는 선순위 전세권 설정(전세금 1억원)이 완료되어 있으며, 채무최고액 2억 5천만 원의 근저당권이 설정되어 있음을 확인한다. 임차인은 이 사실을 충분히 인지하고 본 계약에 동의한다.
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">임대인에게 확인 요청</h3>
          <p className="text-sm text-gray-600 mb-4">
            불일치 사항에 대해 임대인에게 직접 문의하고 공식적인 답변을 받아보세요.
          </p>
          <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            임대인에게 확인 요청하기
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">부동산 배지 검토</h3>
          <p className="text-sm text-gray-600 mb-4">
            이 부동산의 신뢰도 및 안전성 관련 HomeMatch 배지를 상세하게 검토합니다.
          </p>
          <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            배지 검토하기
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">위험 점수 가이드</h3>
          <p className="text-sm text-gray-600 mb-4">
            불일치가 HomeMatch 위험 신호 점수에 어떻게 반영되는지 이해합니다.
          </p>
          <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            위험 점수 가이드 확인
          </button>
        </div>
      </div>
    </div>
  )
}


