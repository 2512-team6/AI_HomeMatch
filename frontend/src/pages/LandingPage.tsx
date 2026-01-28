import { Link, useNavigate } from 'react-router-dom'
import { FileText, Lightbulb, Users, CheckCircle, House, Shield, Gavel, LayoutDashboard, LogOut, X, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import logoImage from '../assets/logo.png'
import logoHouseImage from '../assets/logo_house.png'
import FloatingChatbot from '../components/FloatingChatbot'

export default function LandingPage() {

  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nickname, setNickname] = useState('')
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null)

  const quickTopics = [
    { 
      title: '대항력과 우선변제권', 
      desc: '세입자가 보증금을 보호받기 위한 핵심 권리',
      faqs: [
        { q: '대항력이 무엇인가요?', a: '전입신고를 하면 임대인이 매도를 해도 세입자가 계약을 유지할 수 있는 권리입니다.' },
        { q: '우선변제권은 언제 발생하나요?', a: '임대인이 파산하거나 경매가 진행될 때 보증금을 다른 채권자보다 우선적으로 받을 수 있는 권리입니다.' }
      ]
    },
    { 
      title: '계약 용어', 
      desc: '',
      faqs: [
        { q: '전세와 월세의 차이는?', a: '전세는 보증금만 받고 월세는 보증금과 월세를 함께 받는 임대 형태입니다.' },
        { q: '보증금과 계약금의 차이는?', a: '보증금은 계약 종료 시 반환되는 금액이고, 계약금은 계약 성립을 위한 선금입니다.' }
      ]
    },
    { 
      title: '확정일자의 중요성', 
      desc: '전입신고 다음날부터 발생되는 보증금 보호 효력',
      faqs: [
        { q: '확정일자는 왜 필요한가요?', a: '확정일자가 있으면 임대인이 다른 사람에게 매도해도 보증금을 우선적으로 받을 수 있습니다.' },
        { q: '확정일자는 어떻게 받나요?', a: '전입신고 후 읍면동사무소에서 확정일자 부여를 신청하면 받을 수 있습니다.' }
      ]
    },
    { 
      title: '법률 가이드', 
      desc: '',
      faqs: [
        { q: '임대차보호법의 주요 내용은?', a: '세입자의 권리를 보호하고 계약갱신청구권, 전월세 전환권 등을 규정한 법입니다.' },
        { q: '계약서에 특약을 추가할 수 있나요?', a: '법률에 위배되지 않는 범위에서 양 당사자 합의하에 특약을 추가할 수 있습니다.' }
      ]
    },
    { 
      title: '전세 계약 해지 조건', 
      desc: '계약 만료 전 중도 해지 시 고려 사항',
      faqs: [
        { q: '중도 해지 시 위약금이 있나요?', a: '계약서에 명시된 위약금 조항에 따라 다르며, 일반적으로 1~2개월 분의 보증금이 위약금으로 적용됩니다.' },
        { q: '임대인이 먼저 해지할 수 있나요?', a: '법정 해지 사유가 있거나 계약서에 명시된 경우에만 가능합니다.' }
      ]
    },
    { 
      title: '계약 해지', 
      desc: '',
      faqs: [
        { q: '계약 해지 통지는 어떻게 하나요?', a: '서면으로 해지 의사를 명확히 전달하고, 계약서에 명시된 해지 기간을 준수해야 합니다.' },
        { q: '보증금은 언제 돌려받나요?', a: '계약 해지 후 원상복구 확인이 끝나면 보통 1~2주 내에 반환됩니다.' }
      ]
    },
    { 
      title: '묵시적 갱신이란?', 
      desc: '자동 연장되는 계약 기간 및 조건',
      faqs: [
        { q: '묵시적 갱신은 언제 발생하나요?', a: '계약 만료 후 양 당사자가 계약 해지를 통지하지 않고 계속 거주하면 자동으로 갱신됩니다.' },
        { q: '묵시적 갱신을 막으려면?', a: '계약 만료 1~2개월 전에 해지 의사를 서면으로 통지하면 됩니다.' }
      ]
    },
    { 
      title: '계약 갱신', 
      desc: '',
      faqs: [
        { q: '계약 갱신 시 보증금을 올릴 수 있나요?', a: '갱신 시 보증금 인상은 가능하지만, 상승률 제한이 있으며 세입자 동의가 필요합니다.' },
        { q: '갱신 거부 시 이사비용을 받을 수 있나요?', a: '임대인이 정당한 사유 없이 갱신을 거부하면 이사비용을 청구할 수 있습니다.' }
      ]
    },
    { 
      title: '임대차 3법 핵심', 
      desc: '계약갱신청구권, 전월세',
      faqs: [
        { q: '계약갱신청구권이란?', a: '2년 이상 거주한 세입자가 계약 만료 시 1회에 한해 갱신을 요청할 수 있는 권리입니다.' },
        { q: '전월세 전환이란?', a: '전세 계약이 만료되면 세입자가 월세로 전환하여 계속 거주할 수 있는 권리입니다.' }
      ]
    },
  ]

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
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={logoHouseImage} 
                  alt="Home'Scan Logo" 
                  className="h-12 w-auto object-contain"
                />
                <span className="text-3xl font-bold text-white">Home'Scan</span>
              </div>
              <p className="text-gray-400 text-base">
                Home'Scan이 여러분의 주거 여정을 간소화합니다.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button 
                    onClick={() => setShowFAQModal(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    자주 묻는 질문
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowSupportModal(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    고객센터
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">법적 고지</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button 
                    onClick={() => setShowTermsModal(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    서비스 약관
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowPrivacyModal(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    개인정보 처리방침
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowDisclaimerModal(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    면책 조항
                  </button>
                </li>
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

      {/* FAQ 모달 */}
      {showFAQModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">자주 묻는 질문</h2>
              <button
                onClick={() => setShowFAQModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {quickTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedTopic(expandedTopic === idx ? null : idx)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900 mb-1">{topic.title}</div>
                        {topic.desc && <div className="text-sm text-gray-600">{topic.desc}</div>}
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedTopic === idx ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedTopic === idx && (
                      <div className="px-4 pb-4 space-y-3">
                        {topic.faqs.map((faq, faqIdx) => (
                          <div key={faqIdx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="font-medium text-sm text-gray-900 mb-1">Q. {faq.q}</div>
                            <div className="text-sm text-gray-600">A. {faq.a}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 서비스 약관 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">서비스 약관</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  최종 수정일: 2026년 1월 28일
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제1조 (목적)</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  본 약관은 Home'Scan(이하 "회사")이 제공하는 부동산 임대차 관련 정보 제공 및 계약서 분석 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제2조 (정의)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. "서비스"란 회사가 제공하는 부동산 임대차 관련 정보 제공, 계약서 분석, 법률 정보 안내 등의 서비스를 의미합니다.</p>
                  <p>2. "이용자"란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 의미합니다.</p>
                  <p>3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를 의미합니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제3조 (약관의 게시와 개정)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                  <p>2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
                  <p>3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제4조 (서비스의 제공 및 변경)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>부동산 계약서 분석 및 검토 서비스</li>
                    <li>임대차 관련 법률 정보 제공</li>
                    <li>매물 정보 제공 및 추천</li>
                    <li>거주 관리 및 퇴실 정산 지원</li>
                    <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 제공하는 일체의 서비스</li>
                  </ul>
                  <p>2. 회사는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제5조 (서비스의 중단)</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다. 이 경우 회사는 사전에 공지하며, 부득이한 경우 사후에 통지할 수 있습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제6조 (이용자의 의무)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 이용자는 다음 행위를 하여서는 안 됩니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>신청 또는 변경 시 허위내용의 등록</li>
                    <li>타인의 정보 도용</li>
                    <li>회사가 게시한 정보의 변경</li>
                    <li>회사가 정한 정보 이외의 정보 등의 송신 또는 게시</li>
                    <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                    <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제7조 (면책조항)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                  <p>2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
                  <p>3. 회사가 제공하는 정보는 일반적인 지침이며, 법률 자문을 대체하지 않습니다. 특정 법률 문제에 대해서는 반드시 전문가와 상담하시기 바랍니다.</p>
                  <p>4. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제8조 (준거법 및 관할법원)</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  본 약관은 대한민국 법령에 따라 규율되고 해석되며, 회사와 이용자 간에 발생한 분쟁에 대하여는 대한민국 법원을 관할법원으로 합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 처리방침 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">개인정보 처리방침</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  최종 수정일: 2026년 1월 28일
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Home'Scan(이하 "회사")은 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제1조 (개인정보의 처리 목적)</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                </p>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적</p>
                  <p>2. 서비스 제공: 계약서 분석, 법률 정보 제공, 매물 정보 제공, 거주 관리 서비스 제공</p>
                  <p>3. 고객 문의 대응: 문의사항 확인 및 답변, 민원 처리</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제2조 (개인정보의 처리 및 보유기간)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                  <p>2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)</li>
                    <li>서비스 이용 기록: 3년 (통신비밀보호법)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제3조 (처리하는 개인정보의 항목)</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  회사는 다음의 개인정보 항목을 처리하고 있습니다:
                </p>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회원 가입 시: 이메일, 비밀번호, 닉네임</p>
                  <p>2. 서비스 이용 과정에서 자동 수집: IP주소, 쿠키, MAC주소, 서비스 이용 기록, 접속 로그</p>
                  <p>3. 계약서 분석 서비스 이용 시: 업로드한 계약서 파일 (분석 완료 후 즉시 삭제)</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제4조 (개인정보의 제3자 제공)</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-700 leading-relaxed mt-2">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제5조 (개인정보처리의 위탁)</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-700 leading-relaxed mt-2">
                  <li>클라우드 서버 운영: AWS, Google Cloud 등 (서비스 제공 및 데이터 보관)</li>
                </ul>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  회사는 위탁계약 체결 시 개인정보보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 이용자는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>개인정보 처리정지 요구권</li>
                    <li>개인정보 열람요구권</li>
                    <li>개인정보 정정·삭제요구권</li>
                    <li>개인정보 처리정지 요구권</li>
                  </ul>
                  <p>2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제7조 (개인정보의 파기)</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                  <p>2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>파기절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                    <li>파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제8조 (개인정보 보호책임자)</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                  <p className="mb-1"><strong>개인정보 보호책임자</strong></p>
                  <p>이메일: privacy@homescan.com</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제9조 (개인정보의 안전성 확보조치)</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-700 leading-relaxed">
                  <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                  <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                  <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">제10조 (개인정보 처리방침 변경)</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  이 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 홈페이지의 공지사항을 통하여 고지할 것입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 면책 조항 모달 */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">면책 조항</h2>
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  최종 수정일: 2026년 1월 28일
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">1. 정보 제공의 성격</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Home'Scan(이하 "회사")이 제공하는 모든 정보, 분석 결과, 법률 가이드, 조언 등은 일반적인 지침 및 참고용 자료에 불과하며, 법률 자문, 세무 자문, 부동산 중개, 감정평가 등을 대체하지 않습니다. 회사가 제공하는 정보는 특정 상황에 대한 법률적 판단이나 전문가의 의견을 대신할 수 없습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">2. 법률 자문의 한계</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>회사는 다음 사항에 대해 책임을 지지 않습니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>제공된 정보를 기반으로 한 이용자의 의사결정으로 인한 모든 손해</li>
                    <li>계약서 분석 결과의 정확성, 완전성, 최신성에 대한 보장</li>
                    <li>법률, 규정, 판례의 변경으로 인한 정보의 부정확성</li>
                    <li>이용자의 특정 상황에 대한 법률적 해석의 정확성</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">3. 전문가 상담의 필요성</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  다음의 경우에는 반드시 해당 분야의 전문가와 상담하시기 바랍니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-700 leading-relaxed">
                  <li>중대한 법률 문제가 발생하거나 발생할 가능성이 있는 경우</li>
                  <li>계약서의 특정 조항에 대한 법적 효력이 불분명한 경우</li>
                  <li>분쟁이 발생하거나 발생할 가능성이 있는 경우</li>
                  <li>세무, 회계, 감정평가 등 전문 분야의 판단이 필요한 경우</li>
                  <li>대규모 금전 거래나 중요한 재산 처분과 관련된 경우</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">4. 서비스 이용의 책임</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 이용자는 본 서비스를 이용함에 있어 다음 사항을 인지하고 동의합니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>제공되는 정보는 참고용이며, 최종 의사결정은 이용자의 책임입니다.</li>
                    <li>중요한 법률 문제나 재산 관련 결정은 반드시 전문가와 상담해야 합니다.</li>
                    <li>서비스 이용으로 인한 모든 결과에 대한 책임은 이용자에게 있습니다.</li>
                  </ul>
                  <p>2. 이용자는 제공된 정보를 검증하고, 필요시 추가적인 조사를 수행할 책임이 있습니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">5. 기술적 오류 및 서비스 중단</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회사는 다음의 경우 서비스 제공에 대한 책임을 지지 않습니다:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>천재지변, 전쟁, 폭동, 화재, 파업 등 불가항력으로 인한 서비스 중단</li>
                    <li>통신사업자의 서비스 중지, 정전, 시스템 장애 등으로 인한 서비스 중단</li>
                    <li>해킹, 바이러스 등으로 인한 시스템 오류 및 데이터 손실</li>
                    <li>기술적 오류, 버그, 시스템 업데이트로 인한 일시적 서비스 중단</li>
                  </ul>
                  <p>2. 회사는 서비스의 지속적인 제공을 위해 노력하지만, 서비스의 중단이나 오류로 인한 손해에 대해 책임을 지지 않습니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">6. 제3자 정보 및 링크</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  회사가 제공하는 서비스 내에 포함된 제3자의 정보, 링크, 광고 등에 대해서는 회사가 그 내용의 정확성, 신뢰성, 적법성을 보장하지 않습니다. 제3자 사이트로의 이동은 이용자의 자유의사에 의한 것이며, 이로 인한 손해에 대해 회사는 책임을 지지 않습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">7. 손해배상의 제한</h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>1. 회사는 서비스 이용과 관련하여 이용자에게 발생한 모든 손해에 대해 책임을 지지 않습니다. 다만, 회사의 고의 또는 중과실로 인한 손해의 경우에는 관련 법령에 따라 배상할 수 있습니다.</p>
                  <p>2. 회사의 책임이 인정되는 경우에도, 회사는 이용자가 입은 직접적이고 실제적인 손해에 대해서만 배상책임을 지며, 간접손해, 특별손해, 결과적 손해, 징벌적 손해 등에 대해서는 책임을 지지 않습니다.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">8. 데이터 및 정보의 정확성</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  회사는 제공하는 데이터, 통계, 분석 결과 등의 정확성, 완전성, 최신성을 보장하지 않습니다. 이용자는 중요한 정보에 대해서는 공식 기관이나 전문가를 통해 별도로 확인할 책임이 있습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">9. 면책 조항의 효력</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  본 면책 조항의 일부 조항이 관련 법령에 의해 무효로 판단되더라도, 나머지 조항의 효력에는 영향을 미치지 않습니다. 본 면책 조항은 대한민국 법령에 따라 해석되며, 본 조항과 관련하여 분쟁이 발생할 경우 대한민국 법원의 관할에 따릅니다.
                </p>
              </div>

              <div>
                <p className="text-sm text-red-600 font-bold">
                  중요 안내: 본 서비스는 법률 자문을 대체하지 않습니다.<br />
                  중요한 법률 문제나 재산 관련 결정을 하기 전에 반드시 해당 분야의 전문가(변호사, 공인중개사, 세무사 등)와 상담하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 고객센터 모달 */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">고객센터</h2>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">운영 시간</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>평일: 오전 9시 ~ 오후 6시</p>
                  <p>주말 및 공휴일: 휴무</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">연락처</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>이메일 : <span className="text-primary-600">Home'Scan@naver.com</span></p>
                  <p>전화 : 1234-5678</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">주요 서비스 안내</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>계약서 분석: 업로드한 계약서를 AI가 분석하여 주요 조항과 위험 요소를 안내합니다.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>등기부등본 분석: 부동산의 소유 관계와 권리 상태를 확인할 수 있습니다.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>거주 관리: 입주부터 퇴실까지의 기록을 관리하고 분쟁을 예방합니다.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>AI 챗봇: 임대차 관련 법률 정보와 계약서 조항에 대해 질문할 수 있습니다.</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">이용 가이드</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-medium">계약서 분석 이용 방법:</p>
                  <ol className="list-decimal list-inside ml-2 space-y-1 text-gray-600">
                    <li>계약서 점검 메뉴에서 계약서를 업로드합니다.</li>
                    <li>AI가 자동으로 분석하여 주요 조항과 주의사항을 제공합니다.</li>
                    <li>분석 결과를 확인하고 필요한 경우 전문가와 상담하세요.</li>
                  </ol>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}


