import { Link, useLocation } from 'react-router-dom'
import { Home, Building2, FileText, FileCheck, AlertTriangle, Building, Scale, MessageCircle, Settings } from 'lucide-react'
import { useSidebar } from '../contexts/SidebarContext'

export default function Sidebar() {
  const location = useLocation()
  const { isSidebarOpen, closeSidebar } = useSidebar()

  const navItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/properties', label: '집 찾기', icon: Building2 },
    { path: '/contract/review', label: '계약서 점검', icon: FileText },
    { path: '/contract/discrepancy', label: '계약서 검증', icon: AlertTriangle },
    { path: '/contract/deed', label: '등기부등본', icon: FileCheck },
    { path: '/residency', label: '거주 관리', icon: Building },
    { path: '/moveout', label: '퇴실 관리', icon: Scale },
  ]

  const bottomItems = [
    { path: '/chatbot', label: '챗봇', icon: MessageCircle },
    { path: '/mypage', label: '설정', icon: Settings },
  ]

  return (
    <>
      {/* 모바일 오버레이 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}
      
      {/* 사이드바 */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-40 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="mt-8 pt-8 border-t border-gray-200 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
    </>
  )
}


