import { Link } from 'react-router-dom'
import { Building2, DollarSign, Home, Calendar, FileCheck, Search, AlertTriangle, CheckCircle, Bell } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          나에게 맞는 집을 찾아보세요
        </h1>
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex-1 flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Q 지역을 입력하세요 (예: 강남구)"
              className="flex-1 outline-none"
            />
          </div>
          <input
            type="text"
            placeholder="기간 (예: 2년)"
            className="w-32 border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="text"
            placeholder="예산 (예: 5억)"
            className="w-32 border border-gray-300 rounded-lg px-4 py-2"
          />
          <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            매물 검색
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            어떤 상황에 계신가요? AI로 찾기
          </h2>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            검색
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <Building2 className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">전세 찾기</h3>
            <p className="text-gray-600 mb-4">부담 없는 전세 매물을 찾아보세요.</p>
            <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium">
              바로가기 →
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <DollarSign className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">월세 찾기</h3>
            <p className="text-gray-600 mb-4">다양한 조건의 월세 매물을 확인하세요.</p>
            <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium">
              바로가기 →
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <Home className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">쉐어하우스</h3>
            <p className="text-gray-600 mb-4">함께 살기 좋은 공간을 찾아보세요.</p>
            <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium">
              바로가기 →
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <Calendar className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">단기/긱 매물</h3>
            <p className="text-gray-600 mb-4">짧은 기간 동안 머무를 공간을 찾으세요.</p>
            <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium">
              바로가기 →
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <Search className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">매물 검증만</h3>
            <p className="text-gray-600 mb-4">이미 찾은 매물의 위험 신호를 분석합니다.</p>
            <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium">
              바로가기 →
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <FileCheck className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">계약서 검증만</h3>
            <p className="text-gray-600 mb-4">AI가 계약서를 분석하고 위험 요소를 알려드립니다.</p>
            <Link to="/contract/review" className="text-primary-600 hover:text-primary-700 font-medium">
              바로가기 →
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">새로운 알림</h2>
        <div className="space-y-3">
          <div className="bg-white border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900">▲ 계약 만료 임박</h3>
              <p className="text-gray-600">강남구 역삼동 계약 만료일이 2개월 남았습니다. 갱신 여부를 확인하세요.</p>
            </div>
          </div>
          <div className="bg-white border-l-4 border-blue-500 rounded-lg p-4 flex items-start space-x-3">
            <Bell className="w-6 h-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900">① 새로운 계약서 점검 결과</h3>
              <p className="text-gray-600">업로드하신 전세 계약서의 AI 점검 결과가 나왔습니다. 지금 확인하세요.</p>
            </div>
          </div>
          <div className="bg-white border-l-4 border-green-500 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900">✔ 하자 보수 처리 완료</h3>
              <p className="text-gray-600">신고하신 송파구 잠실동 매물의 누수 하자 보수가 완료되었습니다. 확인해 주세요.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">최근 본 매물</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Link key={i} to={`/properties/${i}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-1">아파트 | 강남구 역삼동</div>
                <div className="font-bold text-lg mb-2">전세 5억 5천</div>
                <div className="text-sm text-gray-600">서울 강남구 테헤란로 123</div>
                <div className="text-sm text-primary-600 mt-2">역세권 신축</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">최근 점검한 계약서</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Link key={i} to="/contract/review" className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <FileCheck className="w-8 h-8 text-primary-600 mb-3" />
              <div className="text-sm text-gray-600 mb-1">전세 계약서 | 강남구 역삼동</div>
              <div className="text-xs text-gray-500 mb-2">최종 점검일: 2023.10.26</div>
              <div className="text-sm text-green-600">위험 낮음 특약 3개</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


