import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ChevronDown, Search, SlidersHorizontal, MapPin, Home, DollarSign, Calendar, Shield, Heart } from 'lucide-react'

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

interface FilterState {
  priceType: '전세' | '월세' | 'all'
  minDeposit: number
  maxDeposit: number
  minRent: number
  maxRent: number
  leaseType: string | null
  parking: boolean | null
  minRooms: number
  maxRooms: number
  minArea: number
  maxArea: number
}

// 필터 범위 상수
const FILTER_RANGES = {
  deposit: { min: 0, max: 50000 }, // 만원 단위 (0 ~ 5억)
  rent: { min: 0, max: 500 }, // 만원 단위 (0 ~ 500만원)
  rooms: { min: 1, max: 10 },
  area: { min: 10, max: 200 }, // m²
}


export default function PropertyListPage() {
  const [properties, setProperties] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    priceType: 'all',
    minDeposit: FILTER_RANGES.deposit.min,
    maxDeposit: FILTER_RANGES.deposit.max,
    minRent: FILTER_RANGES.rent.min,
    maxRent: FILTER_RANGES.rent.max,
    leaseType: null,
    parking: null,
    minRooms: FILTER_RANGES.rooms.min,
    maxRooms: FILTER_RANGES.rooms.max,
    minArea: FILTER_RANGES.area.min,
    maxArea: FILTER_RANGES.area.max,
  })

  useEffect(() => {
  const timer = setTimeout(() => {
    fetchProperties()
  }, 300)

  return () => clearTimeout(timer)
}, [filters])


  const fetchProperties = async () => {
    try {
      setLoading(true)
      
      // 필터 파라미터 구성
      const params = new URLSearchParams()
      
      if (filters.leaseType && filters.leaseType !== 'all') {
        params.append('leaseType', filters.leaseType)
      }
      
      // 보증금 필터 (기본값이 아닐 때만 전송)
      if (filters.minDeposit !== FILTER_RANGES.deposit.min) {
        const minDeposit = filters.minDeposit * 10000 // 만원 단위를 원 단위로 변환
        params.append('minDeposit', minDeposit.toString())
      }
      
      if (filters.maxDeposit !== FILTER_RANGES.deposit.max) {
        const maxDeposit = filters.maxDeposit * 10000
        params.append('maxDeposit', maxDeposit.toString())
      }
      
      // 월세 금액 필터 (월세일 때만 적용)
      if (filters.leaseType === '월세') {
        if (filters.minRent !== FILTER_RANGES.rent.min) {
          const minRent = filters.minRent * 10000 // 만원 단위를 원 단위로 변환
          params.append('minRent', minRent.toString())
        }
        
        if (filters.maxRent !== FILTER_RANGES.rent.max) {
          const maxRent = filters.maxRent * 10000
          params.append('maxRent', maxRent.toString())
        }
      }
      
      if (filters.parking !== null) {
        params.append('parking', filters.parking.toString())
      }
      
      // 방 개수 필터 (기본값이 아닐 때만 전송)
      if (filters.minRooms !== FILTER_RANGES.rooms.min) {
        params.append('minRooms', filters.minRooms.toString())
      }
      
      if (filters.maxRooms !== FILTER_RANGES.rooms.max) {
        params.append('maxRooms', filters.maxRooms.toString())
      }
      
      // 면적 필터 (기본값이 아닐 때만 전송)
      if (filters.minArea !== FILTER_RANGES.area.min) {
        params.append('minArea', filters.minArea.toString())
      }
      
      if (filters.maxArea !== FILTER_RANGES.area.max) {
        params.append('maxArea', filters.maxArea.toString())
      }
      
      const url = `http://localhost:8080/api/listings${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('매물 목록을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setProperties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      console.error('매물 목록 로딩 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      priceType: 'all',
      minDeposit: FILTER_RANGES.deposit.min,
      maxDeposit: FILTER_RANGES.deposit.max,
      minRent: FILTER_RANGES.rent.min,
      maxRent: FILTER_RANGES.rent.max,
      leaseType: null,
      parking: null,
      minRooms: FILTER_RANGES.rooms.min,
      maxRooms: FILTER_RANGES.rooms.max,
      minArea: FILTER_RANGES.area.min,
      maxArea: FILTER_RANGES.area.max,
    })
  }

  const formatPrice = (listing: Listing) => {
    if (listing.leaseType === '전세') {
      return `전세 ${(listing.priceDeposit / 10000).toFixed(0)}만원`
    } else {
      const deposit = (listing.priceDeposit / 10000).toFixed(0)
      const rent = listing.priceRent ? `${listing.priceRent}만원` : ''
      return `월세 ${rent} / 보증금 ${deposit}만원`
    }
  }

  const formatArea = (areaM2: number) => {
    return `${areaM2.toFixed(0)}m²`
  }


  const badgeColors = {
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
  }

  return (
    <div className="flex space-x-6">
      {/* Filter Panel */}
      <div className="w-64 bg-white border border-gray-200 rounded-lg p-4 h-fit">
        <h2 className="text-lg font-bold text-gray-900 mb-4">필터</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">임대 유형</label>
          <div className="flex space-x-4 mb-2">
            <label className="flex items-center">
              <input 
                type="radio" 
                name="leaseType" 
                value="all"
                checked={filters.leaseType === null || filters.leaseType === 'all'}
                onChange={(e) => handleFilterChange('leaseType', e.target.value === 'all' ? null : e.target.value)}
                className="mr-2" 
              />
              <span className="text-sm">전체</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="leaseType" 
                value="전세"
                checked={filters.leaseType === '전세'}
                onChange={(e) => handleFilterChange('leaseType', e.target.value)}
                className="mr-2" 
              />
              <span className="text-sm">전세</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="leaseType" 
                value="월세"
                checked={filters.leaseType === '월세'}
                onChange={(e) => handleFilterChange('leaseType', e.target.value)}
                className="mr-2" 
              />
              <span className="text-sm">월세</span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            보증금 (만원)
          </label>
          <div className="mb-2 text-xs text-gray-600 text-center">
            {filters.minDeposit.toLocaleString()}만원 ~ {filters.maxDeposit.toLocaleString()}만원
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최소</label>
              <input 
                type="range" 
                min={FILTER_RANGES.deposit.min}
                max={FILTER_RANGES.deposit.max}
                step={100}
                value={filters.minDeposit}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value <= filters.maxDeposit) {
                    handleFilterChange('minDeposit', value)
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최대</label>
              <input 
                type="range" 
                min={FILTER_RANGES.deposit.min}
                max={FILTER_RANGES.deposit.max}
                step={100}
                value={filters.maxDeposit}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value >= filters.minDeposit) {
                    handleFilterChange('maxDeposit', value)
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
          </div>
        </div>

        {filters.leaseType === '월세' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월세 금액 (만원)
            </label>
            <div className="mb-2 text-xs text-gray-600 text-center">
              {filters.minRent.toLocaleString()}만원 ~ {filters.maxRent.toLocaleString()}만원
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">최소</label>
                <input 
                  type="range" 
                  min={FILTER_RANGES.rent.min}
                  max={FILTER_RANGES.rent.max}
                  step={10}
                  value={filters.minRent}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value <= filters.maxRent) {
                      handleFilterChange('minRent', value)
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">최대</label>
                <input 
                  type="range" 
                  min={FILTER_RANGES.rent.min}
                  max={FILTER_RANGES.rent.max}
                  step={10}
                  value={filters.maxRent}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value >= filters.minRent) {
                      handleFilterChange('maxRent', value)
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            방 개수
          </label>
          <div className="mb-2 text-xs text-gray-600 text-center">
            {filters.minRooms}개 ~ {filters.maxRooms}개
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최소</label>
              <input 
                type="range" 
                min={FILTER_RANGES.rooms.min}
                max={FILTER_RANGES.rooms.max}
                step={1}
                value={filters.minRooms}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value <= filters.maxRooms) {
                    handleFilterChange('minRooms', value)
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최대</label>
              <input 
                type="range" 
                min={FILTER_RANGES.rooms.min}
                max={FILTER_RANGES.rooms.max}
                step={1}
                value={filters.maxRooms}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value >= filters.minRooms) {
                    handleFilterChange('maxRooms', value)
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            면적 (m²)
          </label>
          <div className="mb-2 text-xs text-gray-600 text-center">
            {filters.minArea.toFixed(0)}m² ~ {filters.maxArea.toFixed(0)}m²
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최소</label>
              <input 
                type="range" 
                min={FILTER_RANGES.area.min}
                max={FILTER_RANGES.area.max}
                step={5}
                value={filters.minArea}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value <= filters.maxArea) {
                    handleFilterChange('minArea', value)
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최대</label>
              <input 
                type="range" 
                min={FILTER_RANGES.area.min}
                max={FILTER_RANGES.area.max}
                step={5}
                value={filters.maxArea}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value >= filters.minArea) {
                    handleFilterChange('maxArea', value)
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">주차</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input 
                type="radio" 
                name="parking" 
                checked={filters.parking === null}
                onChange={() => handleFilterChange('parking', null)}
                className="mr-2" 
              />
              <span className="text-sm text-gray-600">전체</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="parking" 
                checked={filters.parking === true}
                onChange={() => handleFilterChange('parking', true)}
                className="mr-2" 
              />
              <span className="text-sm text-gray-600">주차 가능</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="parking" 
                checked={filters.parking === false}
                onChange={() => handleFilterChange('parking', false)}
                className="mr-2" 
              />
              <span className="text-sm text-gray-600">주차 불가</span>
            </label>
          </div>
        </div>

        <button 
          onClick={resetFilters}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          필터 초기화
        </button>
      </div>

      {/* Property List */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">매물 리스트</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">총 {properties.length}개의 매물</span>
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
              <option>정렬</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">매물 목록을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchProperties}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-3 gap-6">
            {properties.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-600">등록된 매물이 없습니다.</p>
              </div>
            ) : (
              properties.map((property) => (
                <Link
                  key={property.listingId}
                  to={`/properties/${property.listingId}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badgeColors.green}`}>
                        {property.leaseType}
                      </span>
                    </div>
                    <div className="font-bold text-lg mb-1">{formatPrice(property)}</div>
                    <div className="text-sm text-gray-600 mb-2">{formatArea(property.areaM2)}</div>
                    <div className="text-sm text-gray-600 mb-2">◎ {property.address}</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {property.rooms && (
                        <span className="text-xs text-gray-600">{property.rooms}룸</span>
                      )}
                      {property.parking && (
                        <span className="text-xs text-gray-600">주차 가능</span>
                      )}
                      {property.floor && property.floorBuilding && (
                        <span className="text-xs text-gray-600">{property.floor}/{property.floorBuilding}층</span>
                      )}
                    </div>
                    <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                      상세보기
                    </button>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}