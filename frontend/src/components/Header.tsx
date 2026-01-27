import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, User, LogOut, Menu, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSidebar } from '../contexts/SidebarContext'
import logoImage from '../assets/logo.png'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<string>('')
  const { toggleSidebar } = useSidebar()

  useEffect(() => {
    // 1. 토큰 존재 여부 확인
    const token = localStorage.getItem('accessToken')
    const savedNickname = localStorage.getItem('nickname') // 로그인 시 닉네임도 저장했다고 가정
    const savedRole = localStorage.getItem('role') || 'USER'
    
    if (token && savedNickname) {
      setIsLoggedIn(true);
      setNickname(savedNickname);
      setRole(savedRole);
    } else {
      setIsLoggedIn(false);
      setNickname('');
      setRole('');
    }
  }, [location]) // 페이지 이동 때마다 체크

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('nickname')
    localStorage.removeItem('role')
    setIsLoggedIn(false)
    setRole('')
    window.dispatchEvent(new CustomEvent('chat-reset'))
    navigate('/login')
  }

  const hamburgerClick = () => {
    toggleSidebar()
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2">
          <div className="flex items-center h-16">
            {/* 왼쪽: 로고 영역 */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <button
                onClick={() => hamburgerClick()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="메뉴 열기"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/home" className="flex items-center space-x-2">
                <img 
                  src={logoImage} 
                  alt="Home'Scan Logo" 
                  className="h-7 w-auto object-contain"
                />
                {/* <span className="text-xl font-bold text-gray-900">Home'Scan</span> */}
              </Link>
            </div>

            {/* 중앙: 검색창 영역 */}
            <div className="flex-1 flex justify-center px-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Q Search properties..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* 오른쪽: 사용자 정보 영역 */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              {isLoggedIn ? (
                // ✅ 로그인 상태일 때 보여줄 UI
                <div className="flex items-center space-x-3">
                  <button className="relative p-2 text-gray-600 hover:text-gray-900">
                    <Bell className="w-6 h-6" />
                  </button>
                  
                  {/* 관리자 페이지 링크 (admin role일 때만 표시) */}
                  {role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-1 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-medium transition-colors"
                      title="관리자 페이지"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">관리자</span>
                    </Link>
                  )}
                  
                  <div className="flex items-center space-x-2 border-l pl-4 ml-2">
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                      {nickname.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{nickname}님</span>
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="로그아웃"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                // ❌ 로그아웃 상태일 때 보여줄 UI
                <Link to="/login" className="flex items-center space-x-1 text-gray-600 hover:text-primary-600">
                  <User className="w-6 h-6" />
                  <span className="text-sm font-medium">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}


