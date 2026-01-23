import { Link } from 'react-router-dom'
import { Building2, DollarSign, Home, Calendar, FileCheck, Search, AlertTriangle, CheckCircle, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RecentViewedProperty {
  listingId: number
  viewedAt: string
  data: {
    listingId: number
    title: string
    address: string
    priceDeposit: number
    leaseType: string
    priceRent: number | null
    areaM2: number
    floor: number | null
    floorBuilding: number | null
    rooms: number | null
    parking: boolean
  }
}

export default function HomePage() {
  const [recentViews, setRecentViews] = useState<RecentViewedProperty[]>([])

  useEffect(() => {
    loadRecentViews()
  }, [])

  const loadRecentViews = () => {
    try {
      const stored = localStorage.getItem('recentViewedProperties')
      if (stored) {
        const views = JSON.parse(stored)
        setRecentViews(views)
      }
    } catch (error) {
      console.error('최근 본 매물 불러오기 실패:', error)
    }
  }

  const formatPrice = (property: RecentViewedProperty['data']) => {
    if (property.leaseType === '전세') {
      return `전세 ${(property.priceDeposit / 10000).toFixed(0)}만원`
    } else {
      const deposit = (property.priceDeposit / 10000).toFixed(0)
      const rent = property.priceRent ? `${property.priceRent}만원` : ''
      return `월세 ${rent} / 보증금 ${deposit}만원`
    }
  }

  const formatArea = (areaM2: number) => {
    return `${areaM2.toFixed(0)}m²`
  }

  const getAddressParts = (address: string) => {
    // 주소에서 구/동 추출 (예: "서울시 강남구 역삼동" -> "강남구 역삼동")
    const parts = address.split(' ')
    if (parts.length >= 2) {
      return parts.slice(1).join(' ')
    }
    return address
  }

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">최근 본 매물</h2>
          {recentViews.length > 0 && (
            <button
              onClick={() => {
                localStorage.removeItem('recentViewedProperties')
                setRecentViews([])
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              전체 삭제
            </button>
          )}
        </div>
        {recentViews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600">최근 본 매물이 없습니다.</p>
            <Link
              to="/properties"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
            >
              매물 찾기 →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            {recentViews.map((view) => (
              <Link
                key={view.listingId}
                to={`/properties/${view.listingId}`}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="text-sm text-gray-600 mb-1">
                    {view.data.rooms ? `${view.data.rooms}룸` : ''} | {getAddressParts(view.data.address)}
                  </div>
                  <div className="font-bold text-lg mb-2">{formatPrice(view.data)}</div>
                  <div className="text-sm text-gray-600 mb-2">{view.data.title}</div>
                  <div className="text-sm text-gray-600">{formatArea(view.data.areaM2)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {view.data.parking && (
                      <span className="text-xs text-primary-600">주차</span>
                    )}
                    {view.data.floor && view.data.floorBuilding && (
                      <span className="text-xs text-gray-500">{view.data.floor}/{view.data.floorBuilding}층</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(view.viewedAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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


