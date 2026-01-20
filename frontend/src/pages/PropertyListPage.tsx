import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

export default function PropertyListPage() {
  const properties = [
    { id: 1, type: '원룸', size: '33m²', location: '강남구 역삼동', price: '전세 2억 5천만원', features: ['반려동물 가능', '주차 가능'], badge: { text: '안전 매물', color: 'green' } },
    { id: 2, type: '아파트', size: '84m²', location: '서초구 반포동', price: '월세 100만원 / 보증금 1억', features: ['주차 가능', '엘리베이터'], badge: { text: '근저당 높음', color: 'orange' } },
    { id: 3, type: '오피스텔', size: '45m²', location: '영등포구 여의도동', price: '전세 1억 8천만원', features: ['풀옵션'], badge: { text: '소음 주의', color: 'yellow' } },
  ]

  const badgeColors = {
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  }

  return (
    <div className="flex space-x-6">
      {/* Filter Panel */}
      <div className="w-64 bg-white border border-gray-200 rounded-lg p-4 h-fit">
        <h2 className="text-lg font-bold text-gray-900 mb-4">필터</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">가격</label>
          <div className="flex space-x-4 mb-2">
            <label className="flex items-center">
              <input type="radio" name="price" defaultChecked className="mr-2" />
              <span className="text-sm">전세가</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="price" className="mr-2" />
              <span className="text-sm">월세가</span>
            </label>
          </div>
          <div className="space-y-2">
            <input type="range" min="0" max="500000" className="w-full" />
            <div className="flex space-x-2">
              <input type="number" placeholder="0" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
              <input type="number" placeholder="500000" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button className="w-full flex items-center justify-between text-sm font-medium text-gray-700">
            구조 <ChevronDown className="w-4 h-4" />
          </button>
          <div className="mt-2 space-y-2">
            {['원룸', '아파트', '오피스텔', '빌라', '다세대'].map((type) => (
              <label key={type} className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <button className="w-full flex items-center justify-between text-sm font-medium text-gray-700">
            계약 기간 <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <button className="w-full flex items-center justify-between text-sm font-medium text-gray-700">
            여성 안심 옵션 <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <button className="w-full flex items-center justify-between text-sm font-medium text-gray-700">
            반려동물 허용 <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <button className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          필터 초기화
        </button>
      </div>

      {/* Property List */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">매물 리스트</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">총 8개의 매물</span>
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
              <option>정렬</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${badgeColors[property.badge.color as keyof typeof badgeColors]}`}>
                    {property.badge.text}
                  </span>
                </div>
                <div className="font-bold text-lg mb-1">{property.price}</div>
                <div className="text-sm text-gray-600 mb-2">{property.type} | {property.size}</div>
                <div className="text-sm text-gray-600 mb-2">◎ {property.location}</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {property.features.map((feature, idx) => (
                    <span key={idx} className="text-xs text-gray-600">{feature}</span>
                  ))}
                </div>
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                  상세보기
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


