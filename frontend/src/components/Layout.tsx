import { ReactNode } from 'react'
import Header from './Header'
// import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        {/* <Sidebar /> */}
        <main className="flex-1 p-6 ml-5 mr-5">
          {children}
        </main>
      </div>
    </div>
  )
}

