import { useState, useEffect } from 'react'
import { Shield, Users, Home, FileText, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface ChartDataPoint {
  date: string
  users: number
  listings: number
}

interface UserStats {
  totalUsers: number
  totalListings: number
  totalContracts: number
  recentSignups: number
  chartData?: ChartDataPoint[]
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

export default function AdminPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<string>('')
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalListings: 0,
    totalContracts: 0,
    recentSignups: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 권한 확인
    const savedRole = localStorage.getItem('role')
    if (savedRole !== 'ADMIN') {
      alert('관리자 권한이 필요합니다.')
      navigate('/home')
      return
    }
    setRole(savedRole)
    
    // 통계 데이터 로드
    loadStats()
  }, [navigate])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('http://localhost:8080/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('통계 데이터를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setStats({
        totalUsers: data.totalUsers || 0,
        totalListings: data.totalListings || 0,
        totalContracts: data.totalContracts || 0,
        recentSignups: data.recentSignups || 0,
        chartData: data.chartData || []
      })
      setLoading(false)
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error)
      setLoading(false)
    }
  }

  if (role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <span>관리자 대시보드</span>
          </h1>
          <p className="text-gray-600 mt-2">시스템 관리 및 모니터링</p>
        </div>
      </div>

      {/* 통계 카드 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">전체 사용자</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">최근 7일: +{stats.recentSignups}명</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">등록된 매물</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalListings.toLocaleString()}</p>
              </div>
              <Home className="w-12 h-12 text-green-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">활성 매물</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">계약서 검증</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalContracts.toLocaleString()}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">전체 검증 건수</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">최근 가입자</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentSignups.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-yellow-600">최근 7일 기준</span>
            </div>
          </div>
        </div>
      )}

      {/* 차트 섹션 */}
      {!loading && stats.chartData && stats.chartData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 사용자 가입 추이 (라인 차트) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">사용자 가입 추이 (최근 30일)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="가입자 수"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 매물 등록 추이 (막대 차트) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">매물 등록 추이 (최근 30일)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="listings" 
                  fill="#10b981"
                  name="등록 매물 수"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 통합 추이 (라인 차트) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">사용자 가입 및 매물 등록 통합 추이 (최근 30일)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="가입자 수"
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="listings" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="등록 매물 수"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 통계 요약 (파이 차트) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">전체 통계 요약</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">카테고리별 분포</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '사용자', value: stats.totalUsers },
                        { name: '매물', value: stats.totalListings },
                        { name: '계약서 검증', value: stats.totalContracts },
                        { name: '최근 가입자', value: stats.recentSignups }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: '사용자', value: stats.totalUsers },
                        { name: '매물', value: stats.totalListings },
                        { name: '계약서 검증', value: stats.totalContracts },
                        { name: '최근 가입자', value: stats.recentSignups }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[0] }}></div>
                  <span className="text-gray-700">전체 사용자: {stats.totalUsers.toLocaleString()}명</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[1] }}></div>
                  <span className="text-gray-700">등록된 매물: {stats.totalListings.toLocaleString()}개</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[2] }}></div>
                  <span className="text-gray-700">계약서 검증: {stats.totalContracts.toLocaleString()}건</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[3] }}></div>
                  <span className="text-gray-700">최근 가입자 (7일): {stats.recentSignups.toLocaleString()}명</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
