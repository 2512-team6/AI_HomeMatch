import { Link, useNavigate } from 'react-router-dom'
import { FileText, Lightbulb, Users, CheckCircle, House, Shield, Gavel, LayoutDashboard, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import logoImage from '../assets/logo.png'
import logoHouseImage from '../assets/logo_house.png'
import FloatingChatbot from '../components/FloatingChatbot'

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
    window.dispatchEvent(new CustomEvent('chat-reset'))
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={logoImage} 
                alt="Home'Scan Logo" 
                className="h-7 w-auto object-contain"
              />
              {/* <span className="text-xl font-bold text-gray-900">Home'Scan</span> */}
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
                복잡한 계약 문제를
              </div>

              <div className="text-indigo-600">
                한 번 더 확인하세요.
              </div>

            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              계약부터 입주, 퇴실까지 Home'Scan이 모든 과정을 함께합니다.
            </p>
          </div>

          {/* 아이콘 버튼 영역 */}
          <div className="flex justify-center gap-20">
            
            {/* 매물 찾기 - 메인 아이콘 버튼 */}
            <Link
              to="/contract/deed"
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
                등기부등본 분석
              </h3>
              <p className="text-base text-gray-600 text-center leading-relaxed">
                집의 소유 관계와 권리 상태를 확인하고<br />
                위험 요소를 미리 점검하세요.
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
                AI로 위험 조항을 먼저 확인하세요.
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
                어렵고 복잡한 법률 용어로 가득 찬 임대차 계약서, 이제 Home'Scan이 쉽게 풀어드립니다.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <Lightbulb className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">정보 불균형</h3>
              <p className="text-gray-600">
                중개사의 설명과 실제 계약 내용의 차이, Home'Scan이 명확하게 비교하고 검증합니다.
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
      <section className="relative py-28 bg-gray-50 overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-16 right-10 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-20">
            Home'Scan은 이렇게 해결합니다.
          </h2>

          {/* 가로 흐름 카드 */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-10">

            {/* STEP 1 */}
            <div className="flex-1 bg-white rounded-2xl p-10 text-center shadow-sm">
              <span className="inline-block text-sm font-semibold text-indigo-600 mb-4">
                STEP 01
              </span>
              <House className="w-10 h-10 text-indigo-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                등기부등본 분석
              </h3>
              <p className="text-gray-600 leading-relaxed">
                집의 소유 관계와 권리 상태를 정리해<br />
                계약 전에 확인해야 할 위험 요소를 안내합니다.
              </p>
            </div>

            {/* 흐름 표시 */}
            <div className="hidden md:flex items-center text-gray-300 text-3xl">
              →
            </div>

            {/* STEP 2 */}
            <div className="flex-1 bg-white rounded-2xl p-10 text-center shadow-sm">
              <span className="inline-block text-sm font-semibold text-indigo-600 mb-4">
                STEP 02
              </span>
              <FileText className="w-10 h-10 text-indigo-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                계약서 검토
              </h3>
              <p className="text-gray-600 leading-relaxed">
                복잡한 계약 조항을 AI가 정리해<br />
                놓치기 쉬운 부분을 쉽게 이해할 수 있게 돕습니다.
              </p>
            </div>

            {/* 흐름 표시 */}
            <div className="hidden md:flex items-center text-gray-300 text-3xl">
              →
            </div>

            {/* STEP 3 */}
            <div className="flex-1 bg-white rounded-2xl p-10 text-center shadow-sm">
              <span className="inline-block text-sm font-semibold text-indigo-600 mb-4">
                STEP 03
              </span>
              <Users className="w-10 h-10 text-indigo-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                거주 중 관리
              </h3>
              <p className="text-gray-600 leading-relaxed">
                입주부터 퇴실까지의 기록을 관리해<br />
                분쟁 걱정 없는 거주를 지원합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Home'Scan의 핵심 기능
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
                <img 
                  src={logoHouseImage} 
                  alt="Home'Scan Logo" 
                  className="h-7 w-auto object-contain"
                />
                <span className="text-xl font-bold text-white">Home'Scan</span>
              </div>
              <p className="text-gray-400 text-sm">
                Home'Scan simplifies your housing journey.
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
              면책 조항: Home'Scan에서 제공하는 정보는 일반적인 지침이며 법률 자문을 대체하지 않습니다.
            </p>
          </div>
        </div>
      </footer>

      {/* 플로팅 챗봇 - 랜딩 페이지 하단에도 표시 */}
      <FloatingChatbot />
    </div>
  )
}


