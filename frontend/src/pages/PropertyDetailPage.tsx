import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { useParams } from 'react-router-dom'

interface ListingDetail {
  listingId: number
  owner: string
  title: string
  address: string
  lat: number
  lng: number
  priceDeposit: number
  leaseType: string
  priceRent: number | null
  mCost: number | null
  areaM2: number
  builtYear: number | null
  floor: number | null
  floorBuilding: number | null
  rooms: number | null
  bathrooms: number | null
  parking: boolean
  moveInDate: string | null
  createdAt: string
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('basic')
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchListingDetail(parseInt(id))
    }
  }, [id])

  const fetchListingDetail = async (listingId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8080/api/listings/${listingId}`)
      if (!response.ok) {
        throw new Error('매물 정보를 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setListing(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      console.error('매물 상세 정보 로딩 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = () => {
    if (!listing) return ''
    if (listing.leaseType === '전세') {
      return `전세 ${(listing.priceDeposit / 10000).toFixed(0)}만원`
    } else {
      const deposit = (listing.priceDeposit / 10000).toFixed(0)
      const rent = listing.priceRent ? `${listing.priceRent}만원` : ''
      return `월세 ${rent} / 보증금 ${deposit}만원`
    }
  }

  const formatArea = () => {
    if (!listing) return ''
    return `${listing.areaM2.toFixed(0)}m² (${(listing.areaM2 / 3.3).toFixed(1)}평)`
  }

  const tabs = [
    { id: 'basic', label: '기본 정보' },
    { id: 'verification', label: '건물·매물 검증' },
    { id: 'checklist', label: '계약 전 체크리스트 & 현장 검증' },
    { id: 'contract', label: '계약서 AI 점검' },
  ]

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">매물 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || '매물 정보를 찾을 수 없습니다.'}</p>
        <button
          onClick={() => id && fetchListingDetail(parseInt(id))}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>

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
                {formatPrice()}
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">위치: {listing.address}</span>
                </div>
                <div className="text-gray-700">면적: {formatArea()}</div>
                {listing.floor && listing.floorBuilding && (
                  <div className="text-gray-700">층수: {listing.floor}층 / {listing.floorBuilding}층</div>
                )}
                {listing.rooms && (
                  <div className="text-gray-700">방 개수: {listing.rooms}개</div>
                )}
                {listing.bathrooms && (
                  <div className="text-gray-700">욕실: {listing.bathrooms}개</div>
                )}
                {listing.mCost && (
                  <div className="text-gray-700">관리비: {listing.mCost.toLocaleString()}원</div>
                )}
                {listing.parking && (
                  <div className="text-gray-700">주차: 가능</div>
                )}
                {listing.moveInDate && (
                  <div className="text-gray-700">입주 가능일: {new Date(listing.moveInDate).toLocaleDateString('ko-KR')}</div>
                )}
                {listing.builtYear && (
                  <div className="text-gray-700">건축연도: {listing.builtYear}년</div>
                )}
                <div className="text-gray-700">임대인: {listing.owner}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">지도 정보 준비 중입니다. (실제 지도 API 연동 예정)</p>
            <p className="text-sm text-gray-500 mt-2">위도: {listing.lat}, 경도: {listing.lng}</p>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">건물 요약</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {listing.builtYear && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">준공 연도</div>
                  <div className="font-bold">{listing.builtYear}년</div>
                </div>
              )}
              {listing.floorBuilding && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">건물 총 층수</div>
                  <div className="font-bold">{listing.floorBuilding}층</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 mb-1">등록 일시</div>
                <div className="font-bold">{new Date(listing.createdAt).toLocaleDateString('ko-KR')}</div>
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


