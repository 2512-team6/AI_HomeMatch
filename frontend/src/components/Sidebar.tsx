import { Link, useLocation } from 'react-router-dom'
import { Home, Building2, FileText, Building, Scale, MessageCircle, Settings } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()

  const navItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/properties', label: 'Property List', icon: Building2 },
    { path: '/contract/review', label: 'Contract Management', icon: FileText },
    { path: '/residency', label: 'Residency Management', icon: Building },
    { path: '/moveout', label: 'Move-out & Disputes', icon: Scale },
  ]

  const bottomItems = [
    { path: '/chatbot', label: 'Chatbot Assistant', icon: MessageCircle },
    { path: '/mypage', label: 'MyPage / Settings', icon: Settings },
  ]

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <Link to="/home" className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="text-lg font-bold text-gray-900">HomeMatch</span>
          </Link>
        </div>
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
  )
}


