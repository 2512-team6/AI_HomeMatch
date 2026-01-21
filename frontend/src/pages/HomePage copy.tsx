import { Link } from 'react-router-dom'
import { FileCheck, Search, Building2, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - 계약서 검증 강조 */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>AI 계약서 검증 플랫폼</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            전세 사기,<br />AI가 미리 막아드립니다
          </h1>
          <p className="text-xl text-gray-600">
            계약서를 업로드하면 AI가 5분 안에 위험 요소를 분석해드려요
          </p>
        </div>

        {/* 메인 CTA - 계약서 검증 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileCheck className="w-8 h-8 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">계약서 검증하기</h2>
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-1">98.7%</div>
                <div className="text-sm text-gray-600">위험 탐지율</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-1">5분</div>
                <div className="text-sm text-gray-600">평균 분석 시간</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-1">12,847</div>
                <div className="text-sm text-gray-600">검증 완료</div>
              </div>
            </div>
          </div>

          <Link 
            to="/contract/review"
            className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-primary-200"
          >
            계약서 업로드하고 무료로 검증받기 →
          </Link>
          
          <p className="text-sm text-gray-500 text-center mt-4">
            PDF, 이미지 모두 가능 · 개인정보는 안전하게 보호됩니다
          </p>
        </div>

        {/* 서브 CTA - 매물 검색 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="w-6 h-6 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">검증된 매물 찾기</h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="지역을 입력하세요 (예: 강남구, 서초구)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Link
              to="/properties"
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium whitespace-nowrap transition-colors"
            >
              매물 검색
            </Link>
          </div>
        </div>
      </div>

      {/* 위험 사례 경고 섹션 */}
      <div className="bg-red-50 border-t border-b border-red-100 py-8 mb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">최근 1개월, 서울에서 전세 사기 피해 127건 발생</h3>
              <p className="text-gray-700 mb-3">
                특히 깡통전세, 이중계약, 불법 전대 등의 수법이 늘어나고 있습니다.
                계약 전 반드시 검증하세요.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-red-200">깡통전세 67건</span>
                <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-red-200">이중계약 34건</span>
                <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-red-200">불법전대 26건</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 어떻게 작동하나요 */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          어떻게 작동하나요?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="font-bold text-lg mb-2">계약서 업로드</h3>
            <p className="text-gray-600 text-sm">
              PDF나 사진으로 찍은 계약서를 업로드하세요
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="font-bold text-lg mb-2">AI가 분석</h3>
            <p className="text-gray-600 text-sm">
              등기부등본 대조, 특약사항 검토, 위험 요소 탐지
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="font-bold text-lg mb-2">리포트 확인</h3>
            <p className="text-gray-600 text-sm">
              위험도 점수와 개선 방안을 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* 최근 활동 (간소화) */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 최근 검증한 계약서 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">최근 검증한 계약서</h3>
              <div className="space-y-3">
                {[
                  { location: '강남구 역삼동', risk: '낮음', date: '2023.10.26' },
                  { location: '서초구 반포동', risk: '중간', date: '2023.10.25' },
                ].map((item, i) => (
                  <Link 
                    key={i}
                    to="/contract/review" 
                    className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{item.location}</div>
                        <div className="text-sm text-gray-500">{item.date}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.risk === '낮음' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        위험 {item.risk}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 관심 매물 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">관심 매물</h3>
              <div className="space-y-3">
                {[
                  { location: '강남구 역삼동', price: '전세 5억', type: '아파트' },
                  { location: '송파구 잠실동', price: '전세 6억', type: '아파트' },
                ].map((item, i) => (
                  <Link 
                    key={i}
                    to={`/properties/${i+1}`}
                    className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">{item.type} | {item.location}</div>
                        <div className="font-bold text-gray-900">{item.price}</div>
                      </div>
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 마지막 CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          안전한 계약, 지금 시작하세요
        </h2>
        <p className="text-gray-600 mb-8">
          수천 명이 전세 사기를 예방했습니다
        </p>
        <Link
          to="/contract/review"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
        >
          무료로 계약서 검증하기 →
        </Link>
      </div>
    </div>
  )
}