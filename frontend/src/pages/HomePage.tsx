import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  FileCheck, 
  AlertTriangle, 
  Search, 
  Building2, 
  ArrowRight,
  Bell,
  MapPin,
  Calendar
} from 'lucide-react'
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

interface Listing {
  listingId: number
  title: string
  address: string
  priceDeposit: number
  leaseType: string
  priceRent: number | null
  mCost: number | null
  areaM2: number
  floor: number | null
  floorBuilding: number | null
  rooms: number | null
  parking: boolean
  moveInDate: string | null
}

export default function HomePage() {
  const navigate = useNavigate()
  const [recentViews, setRecentViews] = useState<RecentViewedProperty[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [properties, setProperties] = useState<Listing[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)

  useEffect(() => {
    loadRecentViews()
    fetchProperties()
  }, [])

  const loadRecentViews = () => {
    try {
      const stored = localStorage.getItem('recentViewedProperties')
      if (stored) {
        const views = JSON.parse(stored)
        setRecentViews(views.slice(0, 4)) // 최대 4개만 표시
      }
    } catch (error) {
      console.error('최근 본 매물 불러오기 실패:', error)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/properties')
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
    const parts = address.split(' ')
    if (parts.length >= 2) {
      return parts.slice(1).join(' ')
    }
    return address
  }

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true)
      const response = await fetch('http://localhost:8080/api/listings?limit=12')
      
      if (!response.ok) {
        throw new Error('매물 목록을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setProperties(data)
    } catch (err) {
      console.error('매물 목록 로딩 오류:', err)
    } finally {
      setLoadingProperties(false)
    }
  }

  const formatPropertyPrice = (property: Listing) => {
    if (property.leaseType === '전세') {
      return `전세 ${(property.priceDeposit / 10000).toFixed(0)}만원`
    } else {
      const deposit = (property.priceDeposit / 10000).toFixed(0)
      const rent = property.priceRent ? `${property.priceRent}만원` : ''
      return `월세 ${rent} / 보증금 ${deposit}만원`
    }
  }

  const formatPropertyArea = (areaM2: number) => {
    return `${areaM2.toFixed(0)}m²`
  }

  return (
    <div className="space-y-8">
      {/* 빠른 액션 버튼 - 간결하게 */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/contract/review"
          className="group bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">계약서 점검</h3>
          </div>
          <p className="text-sm text-gray-600">AI로 위험 조항 확인</p>
        </Link>

        <Link
          to="/contract/deed"
          className="group bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">등기부등본 분석</h3>
          </div>
          <p className="text-sm text-gray-600">6가지 핵심 확인 항목</p>
        </Link>

        <Link
          to="/contract/discrepancy"
          className="group bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">계약서 점검</h3>
          </div>
          <p className="text-sm text-gray-600">중개사 설명 vs 계약서</p>
        </Link>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">최근 활동</h2>
            <p className="text-sm text-gray-500 mt-1">방금까지 살펴본 매물과 계약서 기록이에요.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 최근 본 매물 */}
          <div className="bg-gray-50 rounded-xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">최근 본 매물</h3>
              </div>
              {recentViews.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('recentViewedProperties')
                    setRecentViews([])
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  전체 삭제
                </button>
              )}
            </div>

            {recentViews.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-gray-200 bg-white/60 py-6 px-4">
                <Building2 className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-600 mb-3">아직 둘러본 매물이 없습니다.</p>
                <Link
                  to="/properties"
                  className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium"
                >
                  매물 보러가기
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="mt-1 grid grid-cols-2 gap-3">
                {recentViews.map((view) => (
                  <Link
                    key={view.listingId}
                    to={`/properties/${view.listingId}`}
                    className="group rounded-lg bg-white overflow-hidden border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200" />
                    <div className="p-3">
                      <div className="text-[11px] text-gray-500 mb-1 truncate">
                        {getAddressParts(view.data.address)}
                      </div>
                      <div className="font-semibold text-sm text-gray-900 mb-0.5 truncate">
                        {formatPrice(view.data)}
                      </div>
                      <div className="text-[11px] text-gray-600">{formatArea(view.data.areaM2)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 최근 점검한 계약서 */}
          <div className="bg-gray-50 rounded-xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">최근 점검한 계약서</h3>
              </div>
              <Link 
                to="/contract/review" 
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                전체 보기
              </Link>
            </div>

            <div className="flex-1 space-y-2">
              {[1, 2].map((i) => (
                <Link 
                  key={i} 
                  to="/contract/review" 
                  className="block bg-white border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-[13px] text-gray-900 mb-0.5">
                          전세 계약서 | 강남구 역삼동
                        </div>
                        <div className="text-[11px] text-gray-500 mb-1">최종 점검일: 2024.01.15</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                            위험 낮음
                          </span>
                          <span className="text-[11px] text-gray-500">특약 3개</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 집 찾기 - 간단하게 통합 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">집 찾기</h2>
          </div>
          <Link 
            to="/properties" 
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            전체 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {/* 간단한 검색바 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus-within:border-primary-500 focus-within:bg-white transition-colors">
            <MapPin className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="지역을 입력하세요 (예: 강남구, 역삼동)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 transition-colors"
          >
            <Search className="w-5 h-5" />
            검색
          </button>
        </div>

        {/* 빠른 필터 */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/properties?leaseType=전세"
            className="px-4 py-2 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-lg text-sm font-medium transition-colors"
          >
            전세
          </Link>
          <Link
            to="/properties?leaseType=월세"
            className="px-4 py-2 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-lg text-sm font-medium transition-colors"
          >
            월세
          </Link>
          <Link
            to="/properties?parking=true"
            className="px-4 py-2 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-lg text-sm font-medium transition-colors"
          >
            주차 가능
          </Link>
        </div>
      </div>

      {/* 알림 섹션 - 정말 중요한 것만 표시 (현재는 예시 데이터) */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">알림</h2>
        <div className="space-y-3">
          {/* 1. 계약 만료/갱신 알림 */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-red-50">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-gray-900 text-[15px]">계약 만료 60일 전 알림</h3>
                <span className="text-xs px-3 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold tracking-tight">
                  중요
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                임대차 계약 만료일이 60일 남았습니다. 갱신 여부 통보, 이사 준비, 보증금 반환 계획을 미리 확인해 주세요.
              </p>
            </div>
          </div>

          {/* 2. 확정일자 / 전입신고 미등록 알림 */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-blue-50">
              <Bell className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-gray-900 text-[15px]">보증금 보호를 위한 절차 확인</h3>
                <span className="text-xs px-3 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold tracking-tight">
                  보증금 보호
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                현재 주소의 확정일자 / 전입신고 여부를 아직 등록하지 않으셨다면, 보증금 보호를 위해 반드시 진행해 주세요.
              </p>
            </div>
          </div>

          {/* 3. 월세·관리비 납부일 임박 알림 */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-amber-50">
              <Calendar className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-gray-900 text-[15px]">월세·관리비 납부일 임박</h3>
                <span className="text-xs px-3 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold tracking-tight">
                  일정
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                이번 달 월세·관리비 납부일이 임박했습니다. 연체로 인한 불이익이 발생하지 않도록 납부 일정을 다시 한 번 확인해 주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 매물 목록 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">추천 매물</h2>
            <p className="text-gray-600 mt-1">다양한 조건의 매물을 확인해보세요</p>
          </div>
          <Link 
            to="/properties" 
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            전체 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingProperties ? (
          <div className="text-center py-12">
            <p className="text-gray-600">매물 목록을 불러오는 중...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">등록된 매물이 없습니다.</p>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              매물 찾기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <Link
                key={property.listingId}
                to={`/properties/${property.listingId}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      property.leaseType === '전세' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      {property.leaseType}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                    {formatPropertyPrice(property)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{property.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{formatPropertyArea(property.areaM2)}</span>
                    {property.rooms && (
                      <span>{property.rooms}룸</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {property.parking && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        주차
                      </span>
                    )}
                    {property.floor && property.floorBuilding && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {property.floor}/{property.floorBuilding}층
                      </span>
                    )}
                  </div>
                  <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
                    상세보기
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
