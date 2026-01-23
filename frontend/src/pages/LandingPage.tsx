import { Link, useNavigate } from 'react-router-dom'
import { FileText, Lightbulb, Users, CheckCircle, House, Shield, Gavel, LayoutDashboard, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {

  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    // 토큰이 있으면 로그인 상태로 간주
    const token = localStorage.getItem('accessToken')
    const savedNickname = localStorage.getItem('nickname')
    if (token) {
      setIsLoggedIn(true)
      setNickname(savedNickname || '사용자')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('nickname')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HomeMatch</span>
            </div>

            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                // 로그인 상태일 때 헤더 버튼
                <>
                  <div className="flex items-center space-x-4">
                    {/* ✅ 닉네임 표시부 디자인 수정 */}
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-gray-900">{nickname}님</span>
                      <span className="text-xs text-primary-600">반가워요!</span>
                    </div>
                    
                    <Link
                      to="/home"
                      className="flex items-center space-x-1 px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>대시보드</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="로그아웃"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                // 로그아웃 상태일 때 헤더 버튼
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    Signup
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-28 overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* 헤더 영역 */}
          <div className="mb-14">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              
              <div className="mb-4">
                복잡한 주거 문제를
              </div>

              <div className="text-indigo-600">
                스마트하게 해결하세요
              </div>

            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              계약부터 입주, 퇴실까지 HomeMatch가 모든 과정을 함께합니다
            </p>
          </div>

          {/* 아이콘 버튼 영역 */}
          <div className="flex justify-center gap-20">
            
            {/* 매물 찾기 - 메인 아이콘 버튼 */}
            <Link
              to="/properties"
              className="
                group
                flex flex-col items-center
                gap-4
              "
            >
              {/* 아이콘 버튼 */}
              <div
                className="
                  w-28 h-28
                  rounded-full
                  bg-white
                  shadow-md
                  ring-2 ring-indigo-200
                  group-hover:shadow-xl
                  group-hover:-translate-y-1
                  transition-all duration-100
                  flex items-center justify-center
                "
              >
                <House className="w-12 h-12 text-indigo-600" />
              </div>

              {/* 텍스트 */}
              <h3 className="text-2xl font-bold text-indigo-600">
                매물 찾기
              </h3>
              <p className="text-base text-gray-600 text-center leading-relaxed">
                조건에 맞는 집을 찾고<br />
                계약까지 안전하게 진행하세요
              </p>
            </Link>

            {/* 계약서 검증 - 서브 아이콘 버튼 */}
            <Link
              to="/contract/review"
              className="
                group
                flex flex-col items-center
                gap-4
              "
            >
              {/* 아이콘 버튼 */}
              <div
                className="
                  w-28 h-28
                  rounded-full
                  bg-white
                  shadow-md
                  ring-1 ring-gray-300
                  group-hover:shadow-xl
                  group-hover:-translate-y-1
                  transition-all duration-200
                  flex items-center justify-center
                "
              >
                <FileText className="w-12 h-12 text-gray-600" />
              </div>

              {/* 텍스트 */}
              <h3 className="text-2xl font-bold text-indigo-600">
                계약서 검증
              </h3>
              <p className="text-base text-gray-600 text-center leading-relaxed">
                이미 계약서가 있다면<br />
                AI로 위험 조항을 먼저 확인하세요
              </p>
            </Link>

          </div>
          {/* 아이콘 버튼 영역 끝 */}
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            이런 문제로 고민하고 계신가요?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <FileText className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">복잡한 계약</h3>
              <p className="text-gray-600">
                어렵고 복잡한 법률 용어로 가득 찬 임대차 계약서, 이제 HomeMatch가 쉽게 풀어드립니다.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <Lightbulb className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">정보 불균형</h3>
              <p className="text-gray-600">
                중개사의 설명과 실제 계약 내용의 차이, HomeMatch가 명확하게 비교하고 검증합니다.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <Users className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">퇴실 분쟁</h3>
              <p className="text-gray-600">
                입주부터 퇴실까지, 원상복구 범위와 보증금 문제로 인한 분쟁을 미리 예방하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            HomeMatch는 이렇게 해결합니다
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <FileText className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI 계약 검토</h3>
              <p className="text-gray-600">
                업로드된 계약서를 분석하여 중요한 조항과 위험 요소를 식별합니다.
              </p>
            </div>
            <div className="text-4xl text-primary-600">→</div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <House className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">부동산 정보 비교</h3>
              <p className="text-gray-600">
                중개사 설명과 실제 계약서 내용을 비교하여 불일치 여부를 확인합니다.
              </p>
            </div>
            <div className="text-4xl text-primary-600">→</div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">거주 중 관리</h3>
              <p className="text-gray-600">
                입주부터 퇴실까지 모든 과정을 체계적으로 관리하고, 분쟁을 예방합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            HomeMatch의 핵심 기능
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <FileText className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI 계약 분석</h3>
              <p className="text-gray-600">
                계약서의 주요 내용과 잠재적 위험을 AI가 빠르고 정확하게 분석합니다.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <House className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">맞춤형 매물 추천</h3>
              <p className="text-gray-600">
                AI가 사용자의 선호도를 기반으로 최적의 매물을 추천합니다.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <CheckCircle className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">중개사 설명 검증</h3>
              <p className="text-gray-600">
                중개사의 구두 설명과 계약서의 실제 내용을 대조하여 허위 정보를 방지합니다.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Shield className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">하자 보고서 자동 생성</h3>
              <p className="text-gray-600">
                입주 전후 하자 사진을 업로드하면 AI가 자동으로 보고서를 작성합니다.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Users className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">퇴실 정산 지원</h3>
              <p className="text-gray-600">
                보증금 반환 절차를 안내하고, 발생할 수 있는 분쟁을 예방합니다.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <Gavel className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">법률 자문 연계</h3>
              <p className="text-gray-600">
                복잡한 법률 문제 발생 시 전문가 연결을 지원합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="text-xl font-bold">HomeMatch</span>
              </div>
              <p className="text-gray-400 text-sm">
                HomeMatch simplifies your housing journey.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">About Us</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Our Mission</li>
                <li>Team</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>FAQ</li>
                <li>Help Center</li>
                <li>Contact Us</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Disclaimer</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-400">
            <p>
              면책 조항: HomeMatch에서 제공하는 정보는 일반적인 지침이며 법률 자문을 대체하지 않습니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}


