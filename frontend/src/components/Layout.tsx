import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext'

function LayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main
        className={`transition-all duration-300 ease-in-out pt-8 ${
          isSidebarOpen
            ? 'md:ml-64 ml-0 pl-4 pr-4 md:pl-8 md:pr-8' // 데스크톱: 사이드바가 열려있을 때 왼쪽 마진 추가, 모바일: 항상 전체 너비
            : 'ml-0 pl-4 pr-4 md:pl-10 md:pr-10'   // 사이드바가 닫혀있을 때 전체 너비 사용
        }`}
      >
        {children}
      </main>
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

