import { useState } from 'react'
import { User, FileText, Trash2 } from 'lucide-react'

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: '프로필 관리', icon: User },
    { id: 'documents', label: '데이터 출처 및 면책 안내', icon: FileText },
    { id: 'settings', label: '문서 삭제/보관 설정', icon: Trash2 },
  ]

  return (
    <div className="flex space-x-6">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border border-gray-200 rounded-lg p-4 h-fit">
        <h2 className="text-lg font-bold text-gray-900 mb-4">설정</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6">
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">프로필 관리</h2>
            <p className="text-gray-600 mb-6">
              개인 정보 및 연락처를 업데이트합니다.
            </p>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  defaultValue="김홍매치"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  defaultValue="kim.homematch@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처
                </label>
                <input
                  type="tel"
                  defaultValue="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                변경 사항 저장
              </button>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">데이터 출처 및 면책 안내</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold mb-2">데이터 출처</h3>
                <p className="text-sm">
                  HomeMatch는 공개된 부동산 정보 및 등기부등본 데이터를 기반으로 정보를 제공합니다.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">면책 조항</h3>
                <p className="text-sm">
                  본 서비스는 주거 관련 정보와 도구를 제공하며, 법률 자문을 대체하지 않습니다. 
                  특정 법률 문제에 대해서는 반드시 전문가와 상담하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">문서 삭제/보관 설정</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">자동 삭제 설정</h3>
                <select className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg">
                  <option>1년 후 자동 삭제</option>
                  <option>2년 후 자동 삭제</option>
                  <option>3년 후 자동 삭제</option>
                  <option>수동 삭제만</option>
                </select>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">보관 문서 목록</h3>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">보관 중인 문서가 없습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


