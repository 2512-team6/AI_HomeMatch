import { useState } from 'react'
import { MapPin } from 'lucide-react'

export default function PropertyDetailPage() {
  const [activeTab, setActiveTab] = useState('basic')

  const tabs = [
    { id: 'basic', label: '기본 정보' },
    { id: 'verification', label: '건물·매물 검증' },
    { id: 'checklist', label: '계약 전 체크리스트 & 현장 검증' },
    { id: 'contract', label: '계약서 AI 점검' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">매물 상세 정보</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">매물 개요</h2>
              <div className="text-3xl font-bold text-primary-600 mb-6">
                월세 100만원 / 보증금 1억원
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">위치: 서울시 강남구 테헤란로 123</span>
                </div>
                <div className="text-gray-700">면적: 84m² (25평)</div>
                <div className="text-gray-700">층수: 15층 / 20층</div>
                <div className="text-gray-700">입주 가능일: 2024년 7월 1일 이후</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">지도 정보 준비 중입니다. (실제 지도 API 연동 예정)</p>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">건물 요약</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">준공 연도</div>
                <div className="font-bold">2015년</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">세대 수</div>
                <div className="font-bold">120세대</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">최근 거래</div>
                <div className="font-bold">2023.10</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">건물 위험 이력 타임라인</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <div className="font-bold text-gray-900">경매 / 압류</div>
                <div className="text-sm text-gray-600">2023.05.15</div>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <div className="font-bold text-gray-900">보증금 미반환</div>
                <div className="text-sm text-gray-600">2022.12.20</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠ 판단이 아닌, 반복 이력 정보입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">집 보기 전 체크리스트</h3>
            <div className="space-y-3">
              {['사람들이 가장 후회한 질문 TOP 5'].map((item, idx) => (
                <label key={idx} className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">현장 검증 기능</h3>
            <div className="space-y-4">
              <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 text-gray-600">
                사진 촬영 가이드
              </button>
              <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 text-gray-600">
                하자 의심 자동 태그
              </button>
              <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 text-gray-600">
                소음 측정 (데시벨)
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contract' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">계약서 업로드</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">계약서 파일을 업로드하세요</p>
            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              파일 선택
            </button>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠ 본 AI 점검 결과는 법률 자문이 아니며, 정보 제공을 목적으로 합니다.
            </p>
          </div>
          <button className="mt-4 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
            계약서 분석 시작
          </button>
        </div>
      )}
    </div>
  )
}


