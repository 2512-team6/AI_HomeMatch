import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext'

function LayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Sidebar />
      <main
        className={`transition-all duration-300 ease-in-out pt-8 pb-8 flex-1 ${
          isSidebarOpen
            ? 'md:ml-64 ml-0 pl-4 pr-4 md:pl-8 md:pr-8' // 데스크톱: 사이드바가 열려있을 때 왼쪽 마진 추가, 모바일: 항상 전체 너비
            : 'ml-0 pl-4 pr-4 md:pl-10 md:pr-10'   // 사이드바가 닫혀있을 때 전체 너비 사용
        }`}
      >
        {children}
      </main>
      
      {/* Footer */}
      <footer className={`bg-gray-900 text-white py-12 mt-4 transition-all duration-300 ease-in-out ${
        isSidebarOpen
          ? 'md:ml-64 ml-0' // 사이드바가 열려있을 때 왼쪽 마진 추가
          : 'ml-0'   // 사이드바가 닫혀있을 때 전체 너비 사용
      }`}>
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

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}

  