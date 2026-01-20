import { useState } from 'react'
import { FileText, Lightbulb, CheckCircle, AlertTriangle, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ContractReviewPage() {
  const [selectedClause, setSelectedClause] = useState(0)

  const clauses = [
    {
      id: 0,
      title: '전세 보증금 반환 의무',
      keywords: ['보증금', '반환', '의무', '만기'],
      original: '제3조(보증금의 반환) 임대인은 임대차 계약기간이 만료되거나 해지되었을 때 임대차 보증금을 임차인에게 즉시 반환하여야 한다. 다만, 임차인의 채무불이행으로 인한 손해배상금 등 임대차 관계에서 발생하는 임차인의 모든 채무를 공제하고 남은 금액을 반환한다.',
      explanation: '임대차 계약이 끝나면 임대인(집주인)은 세입자에게 보증금을 돌려줄 의무가 있습니다. 이때, 만약 세입자가 월세를 밀렸거나 집을 파손하여 수리비가 발생했다면, 그 금액을 제외하고 나머지 보증금을 돌려주게 됩니다.',
      laws: [
        '주택임대차보호법 제3조 (대항력 등)',
        '민법 제618조 (임대차의 의의)',
      ],
      disputes: [
        '계약 만기 시 보증금 반환 지연',
        '수리비, 공과금 등 공제 금액에 대한 이견',
        '임대인이 새로운 임차인을 구하지 못했다는 이유로 반환 거부',
      ],
      standard: '본 계약은 임대차 기간 만료 시 임차인은 임차 목적물을 원상회복하여 임대인에게 명도하고, 임대인은 보증금 전액을 임차인에게 반환한다.',
    },
    {
      id: 1,
      title: '임대차 계약 갱신 청구권',
      keywords: ['갱신', '청구권', '계약'],
      original: '',
      explanation: '',
      laws: [],
      disputes: [],
      standard: '',
    },
  ]

  const currentClause = clauses[selectedClause]

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
          <div>
            <h3 className="font-bold text-red-900 mb-1">면책 고지</h3>
            <p className="text-sm text-red-800">
              본 AI 점검 결과는 법률 자문이 아니며, 정보 제공을 목적으로 합니다. 정확한 법률 판단은 반드시 전문가와 상담하시기 바랍니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Panel - Clause List */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">특약 리스트 및 중요 키워드</h2>
          <div className="space-y-2">
            {clauses.map((clause, idx) => (
              <button
                key={clause.id}
                onClick={() => setSelectedClause(idx)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedClause === idx
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">{clause.title}</div>
                {selectedClause === idx && (
                  <div className="text-sm text-gray-600 mt-2">
                    주요 키워드: {clause.keywords.join(', ')}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Clause Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">선택 특약 원문</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {currentClause.original}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">쉬운 설명</h3>
            </div>
            <p className="text-gray-700">{currentClause.explanation}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">관련 법령</h3>
            </div>
            <ul className="space-y-2">
              {currentClause.laws.map((law, idx) => (
                <li key={idx} className="text-gray-700">• {law}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">분쟁 포인트</h3>
            </div>
            <ul className="space-y-2">
              {currentClause.disputes.map((dispute, idx) => (
                <li key={idx} className="text-gray-700">• {dispute}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-900">추천 표준 문구</h3>
              </div>
              <button className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Copy className="w-4 h-4" />
                <span>복사</span>
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              {currentClause.standard}
            </div>
          </div>

          <Link
            to="/contract/discrepancy"
            className="block w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center font-medium"
          >
            중개사 설명 vs 계약서 불일치 확인하기
          </Link>
        </div>
      </div>
    </div>
  )
}


