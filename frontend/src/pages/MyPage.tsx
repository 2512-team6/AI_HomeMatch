import { useMemo, useState, useEffect } from 'react'
import { User, FileText, Trash2, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface UserData {
  name: string
  nickname: string
  email: string
  phone: string
}

type ConsentStatusResponse = {
  hasAll: boolean
  missingTypes: string[]
}

const DOCUMENT_CONSENT_TYPE = 'DATA_STORE'
const DOCUMENT_CONSENT_VERSION = 'v1.0'

export default function MyPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UserData>({
    name: '',
    nickname: '',
    email: '',
    phone: ''
  })
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentActionLoading, setConsentActionLoading] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consentStatus, setConsentStatus] = useState<ConsentStatusResponse | null>(null)

  const tabs = useMemo(
    () => [
      { id: 'profile', label: '프로필 관리', icon: User },
      { id: 'documents', label: '데이터 출처 및 면책 안내', icon: FileText },
      { id: 'settings', label: '문서 삭제/보관 설정', icon: Trash2 },
      { id: 'consent', label: '문서 보관 및 처리 동의 설정', icon: ShieldCheck },
    ],
    []
  )

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tabs.some((t) => t.id === tab)) {
      setActiveTab(tab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const currentTab = searchParams.get('tab')
    if (currentTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true })
    }
  }, [activeTab, searchParams, setSearchParams])

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('http://localhost:8080/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login')
          return
        }
        throw new Error('사용자 정보를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setFormData({
        name: data.name || '',
        nickname: data.nickname || '',
        email: data.email || '',
        phone: data.phone || ''
      })
      setLoading(false)
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error)
      alert('사용자 정보를 불러오는데 실패했습니다.')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('http://localhost:8080/api/user/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login')
          return
        }
        const errorText = await response.text()
        throw new Error(errorText || '정보 수정에 실패했습니다.')
      }

      const updatedData = await response.json()
      
      // 닉네임이 변경되었으면 localStorage 업데이트
      if (updatedData.nickname) {
        localStorage.setItem('nickname', updatedData.nickname)
      }
      
      alert('정보가 성공적으로 수정되었습니다.')
      
      // 폼 데이터 업데이트
      setFormData({
        name: updatedData.name || '',
        nickname: updatedData.nickname || '',
        email: updatedData.email || '',
        phone: updatedData.phone || ''
      })
    } catch (error) {
      console.error('정보 수정 실패:', error)
      alert(error instanceof Error ? error.message : '정보 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const loadConsentStatus = async () => {
    try {
      setConsentLoading(true)
      setConsentError(null)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }

      const res = await fetch(
        `http://localhost:8080/api/consents/required?types=${encodeURIComponent(DOCUMENT_CONSENT_TYPE)}&version=${encodeURIComponent(DOCUMENT_CONSENT_VERSION)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (res.status === 401) {
        navigate('/login')
        return
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `동의 상태 확인 실패 (HTTP ${res.status})`)
      }

      const data = (await res.json()) as ConsentStatusResponse
      setConsentStatus(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '동의 상태 확인에 실패했습니다.'
      setConsentError(msg)
    } finally {
      setConsentLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'consent') {
      void loadConsentStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const openConsentPreview = () => {
    const next = '/mypage?tab=consent'
    navigate(
      `/consents/document?preview=1&types=${encodeURIComponent(DOCUMENT_CONSENT_TYPE)}&version=${encodeURIComponent(
        DOCUMENT_CONSENT_VERSION
      )}&context=${encodeURIComponent('settings')}&next=${encodeURIComponent(next)}`
    )
  }

  const withdrawConsent = async () => {
    const ok = window.confirm(
      '문서 저장 및 분석 처리 동의를 철회하면, 계약서/등기부등본 업로드 및 분석 기능을 이용할 수 없습니다.\n\n동의를 철회할까요?'
    )
    if (!ok) return

    try {
      setConsentActionLoading(true)
      setConsentError(null)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }

      const res = await fetch('http://localhost:8080/api/consents/withdraw', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentType: DOCUMENT_CONSENT_TYPE,
          version: DOCUMENT_CONSENT_VERSION,
        }),
      })

      if (res.status === 401) {
        navigate('/login')
        return
      }

      if (res.status === 404) {
        alert('철회할 활성 동의가 없습니다.')
        void loadConsentStatus()
        return
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `동의 철회 실패 (HTTP ${res.status})`)
      }

      alert('동의가 철회되었습니다.')
      void loadConsentStatus()
    } catch (e) {
      setConsentError(e instanceof Error ? e.message : '동의 철회에 실패했습니다.')
    } finally {
      setConsentActionLoading(false)
    }
  }

  return (
    <div className="flex space-x-6">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border border-gray-200 rounded-lg p-4 h-fit">
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
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    닉네임
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">이메일 변경 시 중복 체크가 수행됩니다.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : '변경 사항 저장'}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">데이터 출처 및 면책 안내</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold mb-2">데이터 출처</h3>
                <p className="text-sm">
                  Home'Scan는 공개된 부동산 정보 및 등기부등본 데이터를 기반으로 정보를 제공합니다.
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

        {activeTab === 'consent' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">문서 보관 및 처리 동의 설정</h2>
            <p className="text-gray-600 mb-6">
              업로드된 계약서/등기부등본의 저장 및 분석 처리 동의를 확인하고, 필요 시 철회할 수 있습니다.
            </p>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900">데이터 저장 동의/보관·삭제 정책 동의</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    업로드된 계약서 및 등기부등본은 분석 목적에 한해 처리·보관됩니다. 서비스 이용을 위해 문서 저장 및 분석 처리 동의가 필요합니다.
                  </p>

                  <div className="mt-3 text-sm">
                    {consentLoading ? (
                      <span className="text-gray-500">동의 상태를 확인하는 중...</span>
                    ) : consentStatus ? (
                      <span className={consentStatus.hasAll ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                        현재 상태: {consentStatus.hasAll ? '동의 완료' : '미동의'}
                      </span>
                    ) : (
                      <span className="text-gray-500">동의 상태를 확인할 수 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>

              {consentError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {consentError}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openConsentPreview}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  동의 내용 확인
                </button>

                <button
                  type="button"
                  onClick={() => void withdrawConsent()}
                  disabled={consentActionLoading || !consentStatus?.hasAll}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed ${
                    consentStatus?.hasAll
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-gray-200 text-gray-400 bg-gray-50'
                  } ${consentActionLoading ? 'opacity-50' : ''}`}
                >
                  {consentActionLoading ? '처리 중...' : '동의 철회'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}