import { Link } from 'react-router-dom'
import { ChevronDown, Search, SlidersHorizontal, MapPin, Home, DollarSign, Calendar, Shield, Heart } from 'lucide-react'

export default function PropertyListPage() {
  const properties = [
    { id: 1, type: '원룸', size: '33m²', location: '강남구 역삼동', price: '전세 2억 5천만원', features: ['반려동물 가능', '주차 가능'], badge: { text: '안전 매물', color: 'green' } },
    { id: 2, type: '아파트', size: '84m²', location: '서초구 반포동', price: '월세 100만원 / 보증금 1억', features: ['주차 가능', '엘리베이터'], badge: { text: '근저당 높음', color: 'orange' } },
    { id: 3, type: '오피스텔', size: '45m²', location: '영등포구 여의도동', price: '전세 1억 8천만원', features: ['풀옵션'], badge: { text: '소음 주의', color: 'yellow' } },
  ]

  const badgeColors = {
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                매물 찾기
              </h1>
              <div className="hidden md:flex items-center space-x-1 text-sm text-slate-600">
                <Home className="w-4 h-4" />
                <span>총 <strong className="text-slate-900 font-semibold">8개</strong>의 매물</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="지역, 역 검색..." 
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
                <SlidersHorizontal className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Enhanced Filter Panel */}
          <div className="hidden md:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-24">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                    필터
                  </h2>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    초기화
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">원하는 조건을 선택하세요</p>
              </div>
              
              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Price Filter */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    가격 범위
                  </label>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                    <label className="flex items-center flex-1 cursor-pointer">
                      <input type="radio" name="price" defaultChecked className="mr-2 accent-blue-600" />
                      <span className="text-sm font-medium text-slate-700">전세가</span>
                    </label>
                    <label className="flex items-center flex-1 cursor-pointer">
                      <input type="radio" name="price" className="mr-2 accent-blue-600" />
                      <span className="text-sm font-medium text-slate-700">월세가</span>
                    </label>
                  </div>
                  <div className="space-y-3 pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="500000" 
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="최소" 
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      <span className="flex items-center text-slate-400">~</span>
                      <input 
                        type="number" 
                        placeholder="최대" 
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                    </div>
                  </div>
                </div>

                {/* Property Type Filter */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                    <span className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      매물 유형
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {['원룸', '아파트', '오피스텔', '빌라', '다세대'].map((type) => (
                      <label key={type} className="flex items-center p-2.5 bg-slate-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group">
                        <input type="checkbox" className="mr-2 accent-blue-600" />
                        <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Contract Period Filter */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      계약 기간
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Safety Options Filter */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      여성 안심 옵션
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Pet-Friendly Filter */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      반려동물 허용
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md">
                  검색하기
                </button>
              </div>
            </div>
          </div>

          {/* Property Grid */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">정렬</span>
                <select className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer">
                  <option>추천순</option>
                  <option>최신순</option>
                  <option>가격 낮은순</option>
                  <option>가격 높은순</option>
                </select>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="grid grid-cols-3 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                  </div>
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <div className="w-5 h-0.5 bg-slate-400 rounded"></div>
                    <div className="w-5 h-0.5 bg-slate-400 rounded"></div>
                    <div className="w-5 h-0.5 bg-slate-400 rounded"></div>
                  </div>
                </button>
              </div>
            </div>

            {/* Property Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-blue-300"
                >
                  {/* Image Container */}
                  <div className="relative h-52 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-200 group-hover:scale-105 transition-transform duration-300"></div>
                    <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10">
                      <Heart className="w-4 h-4 text-slate-600 hover:text-red-500 transition-colors" />
                    </button>
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${badgeColors[property.badge.color as keyof typeof badgeColors]}`}>
                        {property.badge.text}
                      </span>
                    </div>
                  </div>

                  
                  
                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="font-bold text-xl text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {property.price}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">{property.type}</span>
                        <span className="text-slate-300">|</span>
                        <span>{property.size}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-1.5 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                      <span>{property.location}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {property.features.map((feature, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>

                    <button className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all text-sm shadow-sm group-hover:shadow-md">
                      상세보기
                    </button>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            <div className="mt-8 text-center">
              <button className="px-8 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                더 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}