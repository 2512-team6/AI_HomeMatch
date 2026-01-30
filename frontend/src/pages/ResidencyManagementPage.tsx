import { useState, useRef, useEffect } from 'react'
import { Upload, Calendar, Edit2, Plus, X, Trash2, Info, CheckCircle } from 'lucide-react'

interface HousingCost {
  rent: number // 월세
  maintenance: number // 관리비
  utilities: number // 전기/수도/가스
  paymentDate: number // 납부일 (일)
  autoRegister: boolean // 자동 등록 여부
}

interface MonthlyRecord {
  id?: number
  year: number
  month: number
  rent: number
  maintenance: number
  utilities: number
  paymentDate: number
  paid: boolean
}

interface EntryStatusRecord {
  id: string
  imageUrl: string
  date: string
  type: string
  description?: string
}

export default function ResidencyManagementPage() {
  const [contractStartDate, setContractStartDate] = useState<string>('')
  const [contractEndDate, setContractEndDate] = useState<string>('')
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false)
  const [savedContractStartDate, setSavedContractStartDate] = useState<string>('')
  const [savedContractEndDate, setSavedContractEndDate] = useState<string>('')
  
  // 주거비 등록 관련 state
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false)
  const [housingCost, setHousingCost] = useState<HousingCost>({
    rent: 1200000,
    maintenance: 150000,
    utilities: 80000,
    paymentDate: 5,
    autoRegister: false
  })
  const [tempCost, setTempCost] = useState<HousingCost>(housingCost)
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([])
  
  // 입주 상태 기록 관련 state
  const [entryStatusRecords, setEntryStatusRecords] = useState<EntryStatusRecord[]>([])
  const [isDragging, setIsDragging] = useState<boolean>(false)
  
  // 입주 상태 기록 불러오기 (MoveOutPage API 사용)
  const loadEntryStatusRecords = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('http://localhost:8080/api/moveout/entry-status-records', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const records: EntryStatusRecord[] = data.map((r: any) => ({
          id: r.id.toString(),
          imageUrl: r.imageUrl,
          date: r.recordDate,
          type: r.recordType,
          description: r.description
        }))
        setEntryStatusRecords(records)
      } else if (response.status === 404) {
        // 데이터가 없으면 빈 배열
        setEntryStatusRecords([])
      }
    } catch (error) {
      console.error('입주 상태 기록 불러오기 실패:', error)
    }
  }
  const [isEntryStatusModalOpen, setIsEntryStatusModalOpen] = useState<boolean>(false)
  const [pendingEntryStatus, setPendingEntryStatus] = useState<{ imageUrl: string; date: string } | null>(null)
  const [entryStatusType, setEntryStatusType] = useState<string>('')
  const [customEntryStatusType, setCustomEntryStatusType] = useState<string>('')
  const [isCustomType, setIsCustomType] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 거주 중 상태/이슈 기록 관련 state
  const [residencyIssueImage, setResidencyIssueImage] = useState<string | null>(null)
  const [residencyIssueMemo, setResidencyIssueMemo] = useState<string>('')
  const [isResidencyIssueDragging, setIsResidencyIssueDragging] = useState<boolean>(false)
  const residencyIssueFileInputRef = useRef<HTMLInputElement>(null)
  const [isIssueRecordModalOpen, setIsIssueRecordModalOpen] = useState<boolean>(false)
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null) // 수정 중인 이슈 ID
  const [issueRecordTitle, setIssueRecordTitle] = useState<string>('')
  const [issueRecordStatus, setIssueRecordStatus] = useState<'처리 중' | '접수 완료' | '처리 완료' | '거절'>('접수 완료')

  // 거주 중 이슈 기록 관련 state
  interface DefectIssue {
    id: string
    imageUrl: string
    title: string
    date: string
    status: '처리 중' | '접수 완료' | '처리 완료' | '거절'
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null
    lastNotifiedAt?: string | null
  }
  const [defectIssues, setDefectIssues] = useState<DefectIssue[]>([])

  type TimelineEventType = 'CREATED' | 'NOTIFIED' | 'PROMISED' | 'DELAYED' | 'RE_REQUESTED' | 'COMPLETED'
  interface IssueTimelineEvent {
    id: string
    defectIssueId: string
    eventType: TimelineEventType
    note?: string | null
    createdAt: string
  }

  type AgreementCounterpart = 'LANDLORD' | 'MANAGER'
  type AgreementCommunicationType = 'CALL' | 'MESSAGE' | 'VISIT'
  interface AgreementRecord {
    id: string
    defectIssueId?: string | null
    counterpart: AgreementCounterpart
    communicationType: AgreementCommunicationType
    summary: string
    createdAt: string
  }

  const [agreementRecords, setAgreementRecords] = useState<AgreementRecord[]>([])
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState<boolean>(false)
  const [agreementCounterpart, setAgreementCounterpart] = useState<AgreementCounterpart>('LANDLORD')
  const [agreementCommunicationType, setAgreementCommunicationType] = useState<AgreementCommunicationType>('CALL')
  const [agreementSummary, setAgreementSummary] = useState<string>('')
  const [agreementLinkedIssueId, setAgreementLinkedIssueId] = useState<string>('') // optional
  const [alsoCreatePromisedTimeline, setAlsoCreatePromisedTimeline] = useState<boolean>(false)

  const [isIssueDetailModalOpen, setIsIssueDetailModalOpen] = useState<boolean>(false)
  const [selectedIssue, setSelectedIssue] = useState<DefectIssue | null>(null)
  const [selectedIssueTimelines, setSelectedIssueTimelines] = useState<IssueTimelineEvent[]>([])
  const [isTimelinesLoading, setIsTimelinesLoading] = useState<boolean>(false)

  const [timelineActionModal, setTimelineActionModal] = useState<{
    issueId: string
    eventType: TimelineEventType
    title: string
    note: string
    date?: string
    requireDate?: boolean
  } | null>(null)

  const [riskLevelPickerIssueId, setRiskLevelPickerIssueId] = useState<string | null>(null)

  // UI/UX refactor용(비즈니스 로직 변경 없음): 레이아웃/접힘/모달 상태
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false)
  const [isEntryStatusExpanded, setIsEntryStatusExpanded] = useState<boolean>(false)
  const [isContractPanelOpen, setIsContractPanelOpen] = useState<boolean>(false)
  const [expandedIssueActionsId, setExpandedIssueActionsId] = useState<string | null>(null)
  
  // 입주 상태 종류 목록 (공간별)
  const entryStatusTypes = [
    '현관',
    '거실',
    '안방',
    '주방',
    '욕실',
    '베란다/발코니',
    '기타 공간'
  ]

  // API 호출 헬퍼 함수
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    }
  }

  // 계약 기간 불러오기
  const loadContract = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('http://localhost:8080/api/residency/contract', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setSavedContractStartDate(data.contractStartDate)
          setSavedContractEndDate(data.contractEndDate)
        }
      } else if (response.status === 404) {
        // 데이터가 없으면 그냥 넘어감 (정상)
      }
    } catch (error) {
      console.error('계약 기간 불러오기 실패:', error)
    }
  }

  // 주거비 설정 불러오기
  const loadCostSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('http://localhost:8080/api/residency/cost-settings', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setHousingCost({
            rent: Number(data.rent),
            maintenance: Number(data.maintenance),
            utilities: Number(data.utilities),
            paymentDate: data.paymentDate,
            autoRegister: data.autoRegister
          })
        }
      } else if (response.status === 404) {
        // 데이터가 없으면 그냥 넘어감 (정상)
      }
    } catch (error) {
      console.error('주거비 설정 불러오기 실패:', error)
    }
  }

  // 월별 주거비 기록 불러오기
  const loadMonthlyRecords = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('http://localhost:8080/api/residency/monthly-records', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const records: MonthlyRecord[] = data.map((r: any) => ({
          id: r.id,
          year: r.year,
          month: r.month,
          rent: Number(r.rent),
          maintenance: Number(r.maintenance),
          utilities: Number(r.utilities),
          paymentDate: r.paymentDate,
          paid: r.paid
        }))
        setMonthlyRecords(records)
      } else if (response.status === 404) {
        // 데이터가 없으면 빈 배열
        setMonthlyRecords([])
      }
    } catch (error) {
      console.error('월별 주거비 기록 불러오기 실패:', error)
    }
  }

  // 거주 중 이슈 기록 불러오기
  const loadDefectIssues = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('http://localhost:8080/api/residency/defect-issues', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const issues: DefectIssue[] = data.map((r: any) => ({
          id: r.id.toString(),
          imageUrl: r.imageUrl,
          title: r.title,
          date: r.issueDate,
          status: mapStatusToKorean(r.status),
          riskLevel: r.riskLevel ?? null,
          lastNotifiedAt: r.lastNotifiedAt ?? null,
        }))
        setDefectIssues(issues)
      } else if (response.status === 404) {
        // 데이터가 없으면 빈 배열
        setDefectIssues([])
      }
    } catch (error) {
      console.error('거주 중 이슈 기록 불러오기 실패:', error)
    }
  }

  const loadAgreementRecords = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('http://localhost:8080/api/residency/agreement-records?limit=10', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const records: AgreementRecord[] = data.map((r: any) => ({
          id: r.id.toString(),
          defectIssueId: r.defectIssueId != null ? r.defectIssueId.toString() : null,
          counterpart: r.counterpart,
          communicationType: r.communicationType,
          summary: r.summary,
          createdAt: r.createdAt
        }))
        setAgreementRecords(records)
      }
    } catch (error) {
      console.error('연락/합의 기록 불러오기 실패:', error)
    }
  }

  const loadTimelinesForIssue = async (issueId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      setIsTimelinesLoading(true)

      const response = await fetch(`http://localhost:8080/api/residency/defect-issues/${issueId}/timelines`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const timelines: IssueTimelineEvent[] = data.map((t: any) => ({
          id: t.id.toString(),
          defectIssueId: t.defectIssueId.toString(),
          eventType: t.eventType,
          note: t.note,
          createdAt: t.createdAt
        }))
        setSelectedIssueTimelines(timelines)
      } else {
        setSelectedIssueTimelines([])
      }
    } catch (error) {
      console.error('타임라인 불러오기 실패:', error)
      setSelectedIssueTimelines([])
    } finally {
      setIsTimelinesLoading(false)
    }
  }

  const createTimelineEvent = async (issueId: string, eventType: TimelineEventType, note: string | null) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('로그인이 필요합니다.')
      return
    }

    const response = await fetch(`http://localhost:8080/api/residency/defect-issues/${issueId}/timelines`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        eventType,
        note: note || null
      })
    })

    if (!response.ok) {
      let msg = '타임라인 기록에 실패했습니다.'
      try {
        const err = await response.json()
        if (err?.error) msg = err.error
      } catch {}
      alert(msg)
      return
    }

    // NOTIFIED는 lastNotifiedAt이 업데이트되므로 UI도 반영
    if (eventType === 'NOTIFIED') {
      const nowIso = new Date().toISOString()
      setDefectIssues(prev => prev.map(i => (i.id === issueId ? { ...i, lastNotifiedAt: nowIso } : i)))
      setSelectedIssue(prev => (prev && prev.id === issueId ? { ...prev, lastNotifiedAt: nowIso } : prev))
    }

    if (isIssueDetailModalOpen && selectedIssue?.id === issueId) {
      await loadTimelinesForIssue(issueId)
    }
  }

  const createAgreementRecord = async () => {
    if (!agreementSummary.trim()) {
      alert('요약을 입력해주세요.')
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('로그인이 필요합니다.')
      return
    }

    const response = await fetch('http://localhost:8080/api/residency/agreement-records', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        counterpart: agreementCounterpart,
        communicationType: agreementCommunicationType,
        summary: agreementSummary.trim(),
        defectIssueId: agreementLinkedIssueId ? Number(agreementLinkedIssueId) : null
      })
    })

    if (!response.ok) {
      let msg = '연락/합의 기록 저장에 실패했습니다.'
      try {
        const err = await response.json()
        if (err?.error) msg = err.error
      } catch {}
      alert(msg)
      return
    }

    const data = await response.json()
    const newRecord: AgreementRecord = {
      id: data.id.toString(),
      defectIssueId: data.defectIssueId != null ? data.defectIssueId.toString() : null,
      counterpart: data.counterpart,
      communicationType: data.communicationType,
      summary: data.summary,
      createdAt: data.createdAt
    }

    setAgreementRecords(prev => [newRecord, ...prev].slice(0, 10))

    // 옵션: 연결 이슈가 있고 체크되어 있으면 PROMISED 타임라인도 함께 기록
    if (alsoCreatePromisedTimeline && agreementLinkedIssueId) {
      await createTimelineEvent(
        agreementLinkedIssueId,
        'PROMISED',
        `[연락/합의 기록 연동]\n${agreementSummary.trim()}`
      )
    }

    // 폼 초기화
    setAgreementSummary('')
    setAgreementLinkedIssueId('')
    setAlsoCreatePromisedTimeline(false)
    setIsAgreementModalOpen(false)
  }

  const updateIssueRiskLevel = async (issueId: string, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('로그인이 필요합니다.')
      return
    }

    const response = await fetch(`http://localhost:8080/api/residency/defect-issues/${issueId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ riskLevel })
    })

    if (!response.ok) {
      let msg = '분쟁 위험도 저장에 실패했습니다.'
      try {
        const err = await response.json()
        if (err?.error) msg = err.error
      } catch {}
      alert(msg)
      return
    }

    setDefectIssues(prev => prev.map(i => (i.id === issueId ? { ...i, riskLevel } : i)))
    setSelectedIssue(prev => (prev && prev.id === issueId ? { ...prev, riskLevel } : prev))
    setRiskLevelPickerIssueId(null)
  }

  // 상태 매핑 함수
  const mapStatusToKorean = (status: string): '처리 중' | '접수 완료' | '처리 완료' | '거절' => {
    switch (status) {
      case 'IN_PROGRESS': return '처리 중'
      case 'RECEIVED': return '접수 완료'
      case 'COMPLETED': return '처리 완료'
      case 'REJECTED': return '거절'
      default: return '접수 완료'
    }
  }

  const mapStatusToEnglish = (status: string): string => {
    switch (status) {
      case '처리 중': return 'IN_PROGRESS'
      case '접수 완료': return 'RECEIVED'
      case '처리 완료': return 'COMPLETED'
      case '거절': return 'REJECTED'
      default: return 'RECEIVED'
    }
  }

  const mapRiskLevelToLabel = (riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null) => {
    switch (riskLevel) {
      case 'LOW': return '낮음'
      case 'MEDIUM': return '보통'
      case 'HIGH': return '높음'
      default: return '미설정'
    }
  }

  const mapRiskLevelToBadgeClass = (riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const mapTimelineEventToKorean = (eventType: TimelineEventType) => {
    switch (eventType) {
      case 'CREATED': return '이슈 생성'
      case 'NOTIFIED': return '임대인 통보'
      case 'PROMISED': return '수리 약속'
      case 'DELAYED': return '지연 기록'
      case 'RE_REQUESTED': return '재요청'
      case 'COMPLETED': return '처리 완료'
      default: return eventType
    }
  }

  const mapAgreementCounterpartToKorean = (c: AgreementCounterpart) => {
    return c === 'LANDLORD' ? '임대인' : '관리인'
  }

  const mapAgreementCommunicationToKorean = (t: AgreementCommunicationType) => {
    switch (t) {
      case 'CALL': return '통화'
      case 'MESSAGE': return '메시지'
      case 'VISIT': return '방문'
      default: return t
    }
  }

  const formatDateTimeShort = (value: any) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  // 초기 데이터 로드
  useEffect(() => {
    loadContract()
    loadCostSettings()
    loadMonthlyRecords()
    loadDefectIssues()
    loadAgreementRecords()
    loadEntryStatusRecords()
  }, [])

  const handleDateSave = async () => {
    if (contractStartDate && contractEndDate) {
      // 종료일이 시작일보다 이후인지 확인
      if (new Date(contractEndDate) <= new Date(contractStartDate)) {
        alert('계약 종료일은 시작일보다 이후여야 합니다.')
        return
      }

      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          alert('로그인이 필요합니다.')
          return
        }

        // 토큰 확인 로그
        console.log('토큰 확인:', {
          hasToken: !!token,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        })

        const headers = getAuthHeaders()
        console.log('요청 헤더:', {
          'Content-Type': headers['Content-Type'],
          'Authorization': headers['Authorization'] ? `Bearer ${headers['Authorization'].substring(7, 27)}...` : '없음'
        })

        const response = await fetch('http://localhost:8080/api/residency/contract', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            contractStartDate: contractStartDate, // YYYY-MM-DD 형식
            contractEndDate: contractEndDate,     // YYYY-MM-DD 형식
            contractDurationMonths: null,
            notes: null
          })
        })

        console.log('계약 기간 저장 요청:', {
          contractStartDate,
          contractEndDate,
          status: response.status
        })

        if (response.ok) {
          const data = await response.json()
          setSavedContractStartDate(data.contractStartDate)
          setSavedContractEndDate(data.contractEndDate)
          setIsEditingDate(false)
          alert('계약 기간이 저장되었습니다.')
        } else {
          let errorMessage = '저장에 실패했습니다.'
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (e) {
            const errorText = await response.text()
            console.error('저장 실패 응답:', response.status, errorText)
          }
          
          // 토큰 관련 오류인 경우 재로그인 유도
          if (response.status === 400 && errorMessage.includes('토큰')) {
            if (confirm('인증 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인하시겠습니까?')) {
              localStorage.removeItem('accessToken')
              localStorage.removeItem('nickname')
              window.dispatchEvent(new CustomEvent('chat-reset'))
              window.location.href = '/login'
              return
            }
          }
          
          alert(`${errorMessage} (상태 코드: ${response.status})`)
        }
      } catch (error) {
        console.error('계약 기간 저장 실패:', error)
        alert('저장 중 오류가 발생했습니다.')
      }
    } else {
      alert('계약 시작일과 종료일을 모두 입력해주세요.')
    }
  }

  const handleCostSave = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      // 주거비 설정 저장
      const response = await fetch('http://localhost:8080/api/residency/cost-settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          rent: tempCost.rent,
          maintenance: tempCost.maintenance,
          utilities: tempCost.utilities,
          paymentDate: tempCost.paymentDate,
          autoRegister: tempCost.autoRegister
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // 서버에서 최신 데이터 다시 불러오기
        await loadCostSettings()
        
        // 상태 업데이트
        setHousingCost({
          rent: Number(data.rent),
          maintenance: Number(data.maintenance),
          utilities: Number(data.utilities),
          paymentDate: data.paymentDate,
          autoRegister: data.autoRegister
        })
        
        // tempCost도 업데이트 (다음 모달 열 때 반영)
        setTempCost({
          rent: Number(data.rent),
          maintenance: Number(data.maintenance),
          utilities: Number(data.utilities),
          paymentDate: data.paymentDate,
          autoRegister: data.autoRegister
        })
        
        // 납부일이 변경되었으면 기존 월별 기록의 납부일도 업데이트
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1
        
        // 현재 월의 기록이 있으면 납부일 업데이트
        const currentRecord = monthlyRecords.find(
          (r) => r.year === currentYear && r.month === currentMonth
        )
        
        if (currentRecord) {
          // 기존 기록의 납부일 업데이트
          await fetch(`http://localhost:8080/api/residency/monthly-records`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              year: currentYear,
              month: currentMonth,
              rent: currentRecord.rent,
              maintenance: currentRecord.maintenance,
              utilities: currentRecord.utilities,
              paymentDate: data.paymentDate, // 업데이트된 납부일 사용
              paid: currentRecord.paid,
              notes: null
            })
          })
        }
        
        // 자동 등록이 활성화되어 있으면 현재 및 향후 월에 자동으로 기록 생성
        if (tempCost.autoRegister) {
          // 향후 12개월까지 자동 생성
          for (let i = 0; i < 12; i++) {
            const targetDate = new Date(currentYear, currentMonth - 1 + i, 1)
            const year = targetDate.getFullYear()
            const month = targetDate.getMonth() + 1
            
            // 이미 기록이 있는지 확인
            const existingRecord = monthlyRecords.find(
              (r) => r.year === year && r.month === month
            )
            
            if (existingRecord) {
              // 기존 기록이 있으면 납부일만 업데이트
              await fetch(`http://localhost:8080/api/residency/monthly-records`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  year,
                  month,
                  rent: existingRecord.rent,
                  maintenance: existingRecord.maintenance,
                  utilities: existingRecord.utilities,
                  paymentDate: data.paymentDate, // 업데이트된 납부일 사용
                  paid: existingRecord.paid,
                  notes: null
                })
              })
            } else {
              // API로 월별 기록 생성
              await fetch('http://localhost:8080/api/residency/monthly-records', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  year,
                  month,
                  rent: tempCost.rent,
                  maintenance: tempCost.maintenance,
                  utilities: tempCost.utilities,
                  paymentDate: data.paymentDate, // 업데이트된 납부일 사용
                  paid: false,
                  notes: null
                })
              })
            }
          }
        }
        
        // 기록 다시 불러오기
        await loadMonthlyRecords()
        
        setIsCostModalOpen(false)
        alert('주거비 설정이 저장되었습니다.')
      } else {
        let errorMessage = '저장에 실패했습니다.'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          const errorText = await response.text()
          console.error('주거비 설정 저장 실패 응답:', response.status, errorText)
        }
        alert(`${errorMessage} (상태 코드: ${response.status})`)
      }
    } catch (error) {
      console.error('주거비 설정 저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }
  
  // 현재 월의 기록 가져오기
  const getCurrentMonthRecord = (): MonthlyRecord | null => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    return (
      monthlyRecords.find((r) => r.year === year && r.month === month) || null
    )
  }
  
  // 표시할 주거비 정보 결정 (월별 기록이 있으면 그것을, 없으면 기본값)
  const displayCost = getCurrentMonthRecord() || {
    rent: housingCost.rent,
    maintenance: housingCost.maintenance,
    utilities: housingCost.utilities,
    paymentDate: housingCost.paymentDate,
  }

  // 지난 주거비 내역 가져오기 (현재 월 이전의 기록들)
  const getPastRecords = (): MonthlyRecord[] => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    
    return monthlyRecords
      .filter((record) => {
        if (record.year < currentYear) return true
        if (record.year === currentYear && record.month < currentMonth) return true
        return false
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  }

  const handleCostCancel = () => {
    setTempCost(housingCost)
    setIsCostModalOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatDateShort = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 이미지 압축 및 리사이즈 유틸리티 함수
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // 최대 크기 설정 (1920px)
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1920
          
          let width = img.width
          let height = img.height
          
          // 비율 유지하면서 리사이즈
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height
              height = MAX_HEIGHT
            }
          }
          
          // Canvas로 이미지 리사이즈 및 압축
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas 컨텍스트를 생성할 수 없습니다.'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // JPEG 품질 조정 (0.7 = 70% 품질, 파일 크기와 품질의 균형)
          // MEDIUMTEXT 타입은 최대 16MB까지 가능하므로, 충분한 여유를 두고 1MB로 제한
          let quality = 0.85
          let dataUrl = canvas.toDataURL('image/jpeg', quality)
          
          // base64 데이터 크기가 1MB (약 1,300,000 문자)를 초과하면 품질을 낮춤
          while (dataUrl.length > 1300000 && quality > 0.4) {
            quality -= 0.1
            dataUrl = canvas.toDataURL('image/jpeg', quality)
          }
          
          // 여전히 크면 이미지 크기를 더 줄임
          if (dataUrl.length > 1300000) {
            width = Math.floor(width * 0.8)
            height = Math.floor(height * 0.8)
            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)
            dataUrl = canvas.toDataURL('image/jpeg', 0.6)
          }
          
          resolve(dataUrl)
        }
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'))
      reader.readAsDataURL(file)
    })
  }

  // 파일 업로드 처리
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // 첫 번째 파일만 처리 (다중 파일은 나중에 확장 가능)
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      // 이미지 자동 압축
      const compressedImageUrl = await compressImage(file)
      
      // 모달을 열어서 입주 상태 종류를 입력받음
      setPendingEntryStatus({
        imageUrl: compressedImageUrl,
        date: new Date().toISOString(),
      })
      setIsEntryStatusModalOpen(true)
      setEntryStatusType('')
      setCustomEntryStatusType('')
      setIsCustomType(false)
    } catch (error) {
      console.error('이미지 처리 실패:', error)
      alert('이미지 처리 중 오류가 발생했습니다.')
    }
  }

  // 입주 상태 기록 저장
  const handleEntryStatusSave = async () => {
    if (!pendingEntryStatus) return

    const finalType = isCustomType ? customEntryStatusType : entryStatusType
    
    if (!finalType.trim()) {
      alert('입주 상태 종류를 입력해주세요.')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      // 이미지 크기 확인 (압축 후에도 2MB를 초과하면 경고)
      // 실제로는 압축 함수에서 이미 1MB 이하로 조정하므로 이 체크는 거의 실행되지 않음
      if (pendingEntryStatus.imageUrl.length > 2000000) {
        alert('이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.')
        return
      }

      const response = await fetch('http://localhost:8080/api/moveout/entry-status-records', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          imageUrl: pendingEntryStatus.imageUrl,
          recordType: finalType,
          recordDate: pendingEntryStatus.date.split('T')[0], // YYYY-MM-DD 형식으로 변환
          description: null
        })
      })

      console.log('입주 상태 기록 저장 요청:', {
        imageUrlLength: pendingEntryStatus.imageUrl.length,
        recordType: finalType,
        recordDate: pendingEntryStatus.date.split('T')[0]
      })

      if (response.ok) {
        const data = await response.json()
        const newRecord: EntryStatusRecord = {
          id: data.id.toString(),
          imageUrl: data.imageUrl,
          date: data.recordDate,
          type: data.recordType,
          description: data.description
        }
        setEntryStatusRecords((prev) => [newRecord, ...prev])
        setIsEntryStatusModalOpen(false)
        setPendingEntryStatus(null)
        setEntryStatusType('')
        setCustomEntryStatusType('')
        setIsCustomType(false)
        alert('입주 상태 기록이 저장되었습니다.')
      } else {
        let errorMessage = '저장에 실패했습니다.'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          const errorText = await response.text()
          console.error('입주 상태 기록 저장 실패 응답:', response.status, errorText)
        }
        alert(`${errorMessage} (상태 코드: ${response.status})`)
      }
    } catch (error) {
      console.error('입주 상태 기록 저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  // 입주 상태 기록 모달 취소
  const handleEntryStatusCancel = () => {
    setIsEntryStatusModalOpen(false)
    setPendingEntryStatus(null)
    setEntryStatusType('')
    setCustomEntryStatusType('')
    setIsCustomType(false)
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 입주 상태 기록 삭제
  const handleDeleteEntryStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      const response = await fetch(`http://localhost:8080/api/moveout/entry-status-records/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setEntryStatusRecords((prev) => prev.filter((record) => record.id !== id))
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('입주 상태 기록 삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 거주 중 상태/이슈 기록 파일 업로드 처리
  const handleResidencyIssueUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      // 이미지 자동 압축
      const compressedImageUrl = await compressImage(file)
      setResidencyIssueImage(compressedImageUrl)
    } catch (error) {
      console.error('이미지 처리 실패:', error)
      alert('이미지 처리 중 오류가 발생했습니다.')
    }
  }

  // 거주 중 상태/이슈 기록 드래그 앤 드롭 핸들러
  const handleResidencyIssueDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsResidencyIssueDragging(true)
  }

  const handleResidencyIssueDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsResidencyIssueDragging(false)
  }

  const handleResidencyIssueDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsResidencyIssueDragging(false)
    handleResidencyIssueUpload(e.dataTransfer.files)
  }

  // 거주 중 상태/이슈 기록 파일 선택 핸들러
  const handleResidencyIssueFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleResidencyIssueUpload(e.target.files)
    if (residencyIssueFileInputRef.current) {
      residencyIssueFileInputRef.current.value = ''
    }
  }

  // 거주 중 상태/이슈 기록 저장 (모달 열기)
  const handleResidencyIssueSaveOnly = () => {
    if (!residencyIssueImage) {
      alert('사진을 먼저 업로드해주세요.')
      return
    }
    
    // 메모를 기본 제목으로 설정
    setIssueRecordTitle(residencyIssueMemo || '')
    setIssueRecordStatus('접수 완료')
    setIsIssueRecordModalOpen(true)
  }

  // 이슈 수정 모달 열기
  const handleEditIssue = (issue: DefectIssue) => {
    setEditingIssueId(issue.id)
    setIssueRecordTitle(issue.title)
    setIssueRecordStatus(issue.status)
    setResidencyIssueImage(issue.imageUrl)
    setResidencyIssueMemo('') // 메모는 별도로 불러와야 할 수도 있음
    setIsIssueRecordModalOpen(true)
  }

  // 이슈 기록 모달에서 저장 (생성 또는 수정)
  const handleIssueRecordSave = async () => {
    if (!issueRecordTitle.trim()) {
      alert('이슈 이름을 입력해주세요.')
      return
    }
    
    if (!residencyIssueImage) {
      alert('사진이 없습니다.')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      // 이미지 크기 확인 (압축 후에도 2MB를 초과하면 경고)
      // 실제로는 압축 함수에서 이미 1MB 이하로 조정하므로 이 체크는 거의 실행되지 않음
      if (residencyIssueImage.length > 2000000) {
        alert('이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.')
        return
      }

      const isEditing = editingIssueId !== null
      const url = isEditing 
        ? `http://localhost:8080/api/residency/defect-issues/${editingIssueId}`
        : 'http://localhost:8080/api/residency/defect-issues'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: issueRecordTitle.trim(),
          imageUrl: residencyIssueImage,
          issueDate: isEditing 
            ? defectIssues.find(i => i.id === editingIssueId)?.date || new Date().toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          status: mapStatusToEnglish(issueRecordStatus),
          memo: residencyIssueMemo || null
        })
      })

      console.log(`이슈 기록 ${isEditing ? '수정' : '저장'} 요청:`, {
        id: editingIssueId,
        title: issueRecordTitle.trim(),
        imageUrlLength: residencyIssueImage.length,
        status: mapStatusToEnglish(issueRecordStatus)
      })

      if (response.ok) {
        const data = await response.json()
        const updatedIssue: DefectIssue = {
          id: data.id.toString(),
          imageUrl: data.imageUrl,
          title: data.title,
          date: data.issueDate,
          status: mapStatusToKorean(data.status)
        }
        
        if (isEditing) {
          // 수정: 기존 항목 업데이트
          setDefectIssues((prev) => 
            prev.map(issue => issue.id === editingIssueId ? updatedIssue : issue)
          )
        } else {
          // 생성: 새 항목 추가
          setDefectIssues((prev) => [updatedIssue, ...prev])
        }
        
        // 초기화
        setResidencyIssueImage(null)
        setResidencyIssueMemo('')
        setIssueRecordTitle('')
        setIssueRecordStatus('접수 완료')
        setEditingIssueId(null)
        setIsIssueRecordModalOpen(false)
        alert(`이슈 기록이 ${isEditing ? '수정' : '저장'}되었습니다.`)
      } else {
        let errorMessage = `${isEditing ? '수정' : '저장'}에 실패했습니다.`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          const errorText = await response.text()
          console.error(`이슈 기록 ${isEditing ? '수정' : '저장'} 실패 응답:`, response.status, errorText)
        }
        alert(`${errorMessage} (상태 코드: ${response.status})`)
      }
    } catch (error) {
      console.error(`이슈 기록 ${editingIssueId ? '수정' : '저장'} 실패:`, error)
      alert(`${editingIssueId ? '수정' : '저장'} 중 오류가 발생했습니다.`)
    }
  }

  // 이슈 기록 모달 취소
  const handleIssueRecordCancel = () => {
    setIsIssueRecordModalOpen(false)
    setIssueRecordTitle('')
    setIssueRecordStatus('접수 완료')
    setResidencyIssueImage(null)
    setResidencyIssueMemo('')
    setEditingIssueId(null)
  }

  // UI 표시용 파생 값(비즈니스 로직 변경 없음)
  const inProgressIssueCount = defectIssues.filter(
    (i) => i.status === '처리 중' || i.status === '접수 완료'
  ).length
  const currentMonthLabel = `${new Date().getMonth() + 1}월`
  const contractDDayText = (() => {
    if (!savedContractEndDate) return '미등록'
    const today = new Date()
    const end = new Date(savedContractEndDate)
    const daysRemaining = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (Number.isNaN(daysRemaining)) return '미등록'
    if (daysRemaining > 0) return `D-${daysRemaining}`
    if (daysRemaining === 0) return 'D-DAY'
    return `D+${Math.abs(daysRemaining)}`
  })()

  return (
    <div className="space-y-6">
      {/* 상단 요약 바 (sticky) */}
      <div className="sticky top-0 z-40">
        <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900">거주 중 관리</div>
              <div className="text-xs text-gray-600 truncate">
                {savedContractStartDate && savedContractEndDate
                  ? `${formatDateShort(savedContractStartDate)} ~ ${formatDateShort(savedContractEndDate)}`
                  : '계약 기간 미등록'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm">
                <span className="text-gray-600">계약</span>{' '}
                <span className="font-bold text-gray-900">{contractDDayText}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm">
                <span className="text-gray-600">이번 달 납부일</span>{' '}
                <span className="font-bold text-gray-900">{displayCost.paymentDate}일</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm">
                <span className="text-gray-600">진행 중 이슈</span>{' '}
                <span className="font-bold text-gray-900">{inProgressIssueCount}건</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 레이아웃: 70/30 Grid (사이드바 대응) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        {/* 메인 액션 영역 */}
        <div className="space-y-6 min-w-0">
          {/* 1) 거주 중 이슈 기록 (가장 강조된 카드) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">이슈 기록하기</h2>
                <p className="text-sm text-gray-600 mt-1">
                  사진 업로드 → 한 줄 메모 → 기록하기
                </p>
              </div>
              <button
                onClick={() => setIsAgreementModalOpen(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                연락/합의 기록
              </button>
            </div>

            {/* 파일 업로드 영역 */}
            <div
              onDragOver={handleResidencyIssueDragOver}
              onDragLeave={handleResidencyIssueDragLeave}
              onDrop={handleResidencyIssueDrop}
              onClick={() => residencyIssueFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isResidencyIssueDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-3 ${
                isResidencyIssueDragging ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <p className={`text-sm ${isResidencyIssueDragging ? 'text-primary-600 font-medium' : 'text-gray-600'}`}>
                {isResidencyIssueDragging
                  ? '여기에 파일을 놓아주세요'
                  : '사진을 드래그하거나 클릭하여 업로드'}
              </p>
              <p className="text-xs text-gray-400 mt-1">이미지 파일만 업로드 가능</p>
            </div>

            <input
              ref={residencyIssueFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleResidencyIssueFileSelect}
              className="hidden"
            />

            {/* 한줄 메모 + CTA */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={residencyIssueMemo}
                onChange={(e) => setResidencyIssueMemo(e.target.value)}
                placeholder="예) 욕실 실리콘 곰팡이 / 창문 틈새 바람"
                className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <button
                onClick={handleResidencyIssueSaveOnly}
                disabled={!residencyIssueImage}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
              >
                기록하기
              </button>
            </div>
          </div>

          {/* 2) 최근 이슈 목록 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">최근 이슈</h2>
                <p className="text-sm text-gray-600 mt-1">
                  핵심 액션만 노출하고, 나머지는 “더보기”로 정리했어요.
                </p>
              </div>
              <div className="text-sm text-gray-600">
                진행 중 <span className="font-bold text-gray-900">{inProgressIssueCount}</span>건
              </div>
            </div>

            {defectIssues.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                등록된 이슈가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {defectIssues.map((issue) => {
                  const statusColors = {
                    '처리 중': 'bg-yellow-100 text-yellow-800',
                    '접수 완료': 'bg-blue-100 text-blue-800',
                    '처리 완료': 'bg-green-100 text-green-800',
                    '거절': 'bg-red-100 text-red-800'
                  }

                  const isExpanded = expandedIssueActionsId === issue.id

                  return (
                    <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={issue.imageUrl}
                          alt={issue.title}
                          className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-gray-900 truncate">{issue.title}</div>
                            <button
                              type="button"
                              onClick={() => setRiskLevelPickerIssueId(issue.id)}
                              className={`px-2 py-0.5 rounded border text-xs font-medium ${mapRiskLevelToBadgeClass(issue.riskLevel)}`}
                              title="분쟁 위험도 설정"
                            >
                              위험도: {mapRiskLevelToLabel(issue.riskLevel)}
                            </button>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{issue.date}</div>
                          {issue.lastNotifiedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              마지막 통보: {formatDateTimeShort(issue.lastNotifiedAt)}
                            </div>
                          )}

                          {/* 주요 액션 (항상 노출) */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedIssue(issue)
                                setIsIssueDetailModalOpen(true)
                                await loadTimelinesForIssue(issue.id)
                              }}
                              className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              타임라인
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await createTimelineEvent(issue.id, 'NOTIFIED', null)
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              임대인 통보
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedIssueActionsId((prev) => (prev === issue.id ? null : issue.id))}
                              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              {isExpanded ? '닫기' : '더보기'}
                            </button>
                          </div>

                          {/* 보조 액션 (더보기에서만) */}
                          {isExpanded && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTimelineActionModal({
                                      issueId: issue.id,
                                      eventType: 'PROMISED',
                                      title: '약속 기록',
                                      note: '',
                                      date: new Date().toISOString().split('T')[0],
                                      requireDate: true
                                    })
                                  }}
                                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                  약속 기록
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTimelineActionModal({
                                      issueId: issue.id,
                                      eventType: 'DELAYED',
                                      title: '지연 기록',
                                      note: ''
                                    })
                                  }}
                                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                  지연
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTimelineActionModal({
                                      issueId: issue.id,
                                      eventType: 'RE_REQUESTED',
                                      title: '재요청 기록',
                                      note: ''
                                    })
                                  }}
                                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                  재요청
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditIssue(issue)}
                                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  수정
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[issue.status]}`}>
                            {issue.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => {
                if (defectIssues.length > 0) {
                  alert('임대인 요청 문서 생성 기능은 준비 중입니다.')
                } else {
                  alert('등록된 이슈가 없습니다.')
                }
              }}
              className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              임대인 요청 문서 생성
            </button>
          </div>

          {/* [A-2] 연락/합의 기록 (메인에 두되, 밀도는 낮게) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">최근 연락/합의 기록</h2>
              <button
                onClick={() => setIsAgreementModalOpen(true)}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                기록 추가
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              최근 10개만 표시됩니다. 필요하면 “기록 추가”로 바로 남겨주세요.
            </p>

            {agreementRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                아직 연락/합의 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {agreementRecords.slice(0, 10).map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900">
                      {mapAgreementCounterpartToKorean(r.counterpart)} · {mapAgreementCommunicationToKorean(r.communicationType)}
                      {r.defectIssueId ? (
                        <span className="text-gray-500 font-normal"> · 이슈 #{r.defectIssueId}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDateTimeShort(r.createdAt)}
                    </div>
                    <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {r.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3) 입주 상태 기록 (기본 접힘: Accordion) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <button
              type="button"
              onClick={() => setIsEntryStatusExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-3"
            >
              <div className="text-left">
                <div className="text-xl font-bold text-gray-900">입주 상태 기록</div>
                <div className="text-sm text-gray-600 mt-1">
                  {entryStatusRecords.length}건 저장됨 · 필요할 때만 펼쳐서 확인/추가하세요
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {isEntryStatusExpanded ? '접기' : '펼치기'}
              </div>
            </button>

            {isEntryStatusExpanded && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <button
                    onClick={() => setIsGuideModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Info className="w-4 h-4" />
                    촬영 가이드 보기
                  </button>
                  <div className="text-xs text-gray-500">
                    입주 당시 상태를 남기면 퇴실 분쟁 예방에 도움이 됩니다.
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* 파일 업로드 */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center ${
                      isDragging
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${
                      isDragging ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm ${isDragging ? 'text-primary-600 font-medium' : 'text-gray-600'}`}>
                      {isDragging ? '여기에 파일을 놓아주세요' : '사진 업로드'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">드래그 또는 클릭</p>
                  </div>

                  {entryStatusRecords.map((record) => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('이 기록을 삭제할까요?')) {
                            handleDeleteEntryStatus(record.id)
                          }
                        }}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <img
                        src={record.imageUrl}
                        alt={record.type}
                        className="w-full h-32 object-cover rounded mb-3 border border-gray-200"
                      />
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {record.type}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDateShort(record.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 보조 정보 패널 (sticky) */}
        <div className="space-y-6 min-w-0 lg:sticky lg:top-24 self-start">
          {/* 주거비 요약 (달력은 모달로만) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{currentMonthLabel} 예상 주거비</h3>
                <div className="text-sm text-gray-600 mt-1">달력은 “달력 보기”로만 열립니다.</div>
              </div>
              <button
                onClick={() => setIsCalendarModalOpen(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                달력 보기
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">월세</span>
                <span className="font-bold">{formatCurrency(displayCost.rent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">관리비</span>
                <span className="font-bold">{formatCurrency(displayCost.maintenance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">전기/수도/가스</span>
                <span className="font-bold">~{formatCurrency(displayCost.utilities)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">총 예상 금액</span>
                <span className="font-bold text-primary-600">
                  ~{formatCurrency(displayCost.rent + displayCost.maintenance + displayCost.utilities)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">납부 예정일</div>
              <div className="text-sm font-medium text-gray-900">
                매월 {displayCost.paymentDate}일
              </div>
              {housingCost.autoRegister && (
                <div className="text-xs text-primary-600 mt-2 flex items-center gap-1">
                  <span>✓</span>
                  <span>자동 등록 활성화됨</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  const currentRecord = getCurrentMonthRecord()
                  if (currentRecord) {
                    setTempCost({
                      rent: currentRecord.rent,
                      maintenance: currentRecord.maintenance,
                      utilities: currentRecord.utilities,
                      paymentDate: currentRecord.paymentDate,
                      autoRegister: housingCost.autoRegister
                    })
                  } else {
                    setTempCost(housingCost)
                  }
                  setIsCostModalOpen(true)
                }}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                주거비 등록/수정
              </button>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                지난 주거비 내역 보기
              </button>
            </div>
          </div>

          {/* 계약 기간 설정(접힘) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <button
              type="button"
              onClick={() => setIsContractPanelOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">계약 기간</div>
                <div className="text-sm text-gray-600 mt-1">
                  {savedContractStartDate && savedContractEndDate
                    ? `${formatDateShort(savedContractStartDate)} ~ ${formatDateShort(savedContractEndDate)} · ${contractDDayText}`
                    : '미등록'}
                </div>
              </div>
              <div className="text-sm text-gray-600">{isContractPanelOpen ? '접기' : '설정'}</div>
            </button>

            {isContractPanelOpen && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <h3 className="text-base font-bold text-gray-900">거주 계약 기간</h3>
                  </div>
                  {!isEditingDate && (
                    <button
                      onClick={() => {
                        setIsEditingDate(true)
                        setContractStartDate(savedContractStartDate)
                        setContractEndDate(savedContractEndDate)
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      {savedContractStartDate ? '수정' : '등록'}
                    </button>
                  )}
                </div>

                {isEditingDate ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          계약 시작일 (입주일)
                        </label>
                        <input
                          type="date"
                          value={contractStartDate}
                          onChange={(e) => {
                            setContractStartDate(e.target.value)
                            if (contractEndDate && new Date(contractEndDate) <= new Date(e.target.value)) {
                              const endDate = new Date(e.target.value)
                              endDate.setMonth(endDate.getMonth() + 12)
                              setContractEndDate(endDate.toISOString().split('T')[0])
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          max={contractEndDate || undefined}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          계약 종료일 (거주 마감일)
                        </label>
                        <input
                          type="date"
                          value={contractEndDate}
                          onChange={(e) => setContractEndDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          min={contractStartDate || undefined}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDateSave}
                        disabled={!contractStartDate || !contractEndDate}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDate(false)
                          setContractStartDate(savedContractStartDate)
                          setContractEndDate(savedContractEndDate)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {savedContractStartDate && savedContractEndDate
                      ? `${formatDateShort(savedContractStartDate)} ~ ${formatDateShort(savedContractEndDate)}`
                      : '거주 계약 기간을 등록해주세요.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 주거비 달력 모달 (항상 숨김 → 버튼으로만 노출) */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{currentMonthLabel} 주거비 달력</h3>
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                납부일(예정): <span className="font-bold text-gray-900">{displayCost.paymentDate}일</span>
              </div>
              <button
                onClick={() => {
                  const currentRecord = getCurrentMonthRecord()
                  if (currentRecord) {
                    setTempCost({
                      rent: currentRecord.rent,
                      maintenance: currentRecord.maintenance,
                      utilities: currentRecord.utilities,
                      paymentDate: currentRecord.paymentDate,
                      autoRegister: housingCost.autoRegister
                    })
                  } else {
                    setTempCost(housingCost)
                  }
                  setIsCostModalOpen(true)
                  setIsCalendarModalOpen(false)
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                주거비 등록
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setTempCost({
                      ...housingCost,
                      paymentDate: day,
                      autoRegister: housingCost.autoRegister
                    })
                    setIsCostModalOpen(true)
                    setIsCalendarModalOpen(false)
                  }}
                  className={`text-center py-4 min-h-[48px] rounded transition-colors border ${
                    day === displayCost.paymentDate
                      ? 'bg-primary-100 text-primary-700 font-bold border-primary-200 hover:bg-primary-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>{day}</div>
                  {day === displayCost.paymentDate && (
                    <div className="text-xs mt-1">납부일</div>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-3">
              ● 날짜를 눌러 납부일을 설정하고 주거비를 등록/수정할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 주거비 등록 모달 */}
      {isCostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">주거비 등록</h2>
              <button
                onClick={handleCostCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 납부일 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  납부일 (매월 몇 일)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={tempCost.paymentDate}
                  onChange={(e) =>
                    setTempCost({
                      ...tempCost,
                      paymentDate: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  매월 {tempCost.paymentDate}일에 납부 예정입니다.
                </p>
              </div>

              {/* 월세 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월세 (원)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempCost.rent}
                  onChange={(e) =>
                    setTempCost({
                      ...tempCost,
                      rent: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="월세 금액을 입력하세요"
                />
              </div>

              {/* 관리비 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리비 (원)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempCost.maintenance}
                  onChange={(e) =>
                    setTempCost({
                      ...tempCost,
                      maintenance: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="관리비 금액을 입력하세요"
                />
              </div>

              {/* 전기/수도/가스 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전기/수도/가스 (원)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempCost.utilities}
                  onChange={(e) =>
                    setTempCost({
                      ...tempCost,
                      utilities: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="예상 전기/수도/가스 비용을 입력하세요"
                />
                <p className="text-xs text-gray-500 mt-1">
                  실제 사용량에 따라 변동될 수 있습니다.
                </p>
              </div>

              {/* 자동 등록 옵션 */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempCost.autoRegister}
                    onChange={(e) =>
                      setTempCost({
                        ...tempCost,
                        autoRegister: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      매월 자동 등록
                    </div>
                    <div className="text-xs text-gray-500">
                      설정한 주거비가 매월 자동으로 기록됩니다
                    </div>
                  </div>
                </label>
              </div>

              {/* 총액 미리보기 */}
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">총 예상 금액</div>
                <div className="text-2xl font-bold text-primary-700">
                  {formatCurrency(
                    tempCost.rent +
                      tempCost.maintenance +
                      tempCost.utilities
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCostSave}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  저장
                </button>
                <button
                  onClick={handleCostCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 지난 주거비 내역 모달 */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">지난 주거비 내역</h2>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {getPastRecords().length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2">등록된 지난 주거비 내역이 없습니다.</p>
                <p className="text-sm text-gray-400">
                  주거비를 등록하면 여기서 확인할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getPastRecords().map((record, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {record.year}년 {record.month}월
                        </h3>
                        <p className="text-xs text-gray-500">
                          납부일: 매월 {record.paymentDate}일
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.paid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {record.paid ? '납부 완료' : '미납'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">월세</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(record.rent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">관리비</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(record.maintenance)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">전기/수도/가스</div>
                        <div className="text-sm font-medium text-gray-900">
                          ~{formatCurrency(record.utilities)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">총액</span>
                      <span className="text-lg font-bold text-primary-600">
                        ~{formatCurrency(
                          record.rent + record.maintenance + record.utilities
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 입주 상태 종류 입력 모달 */}
      {isEntryStatusModalOpen && pendingEntryStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">입주 상태 정보 입력</h2>
              <button
                onClick={handleEntryStatusCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 이미지 미리보기 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업로드된 사진
                </label>
                <img
                  src={pendingEntryStatus.imageUrl}
                  alt="입주 상태 사진"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>

              {/* 입주 상태 종류 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입주 상태 종류
                </label>
                <div className="space-y-2">
                  {/* 기본 종류 선택 */}
                  <div className="grid grid-cols-2 gap-2">
                    {entryStatusTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setEntryStatusType(type)
                          setIsCustomType(false)
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          !isCustomType && entryStatusType === type
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* 직접 입력 옵션 */}
                  <div className="pt-2 border-t border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCustomType}
                        onChange={(e) => {
                          setIsCustomType(e.target.checked)
                          if (e.target.checked) {
                            setEntryStatusType('')
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">직접 입력</span>
                    </label>
                    {isCustomType && (
                      <input
                        type="text"
                        value={customEntryStatusType}
                        onChange={(e) => setCustomEntryStatusType(e.target.value)}
                        placeholder="입주 상태 종류를 입력하세요"
                        className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleEntryStatusSave}
                  disabled={!isCustomType ? !entryStatusType : !customEntryStatusType.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  저장
                </button>
                <button
                  onClick={handleEntryStatusCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 입주 시점 하자 기록 가이드 모달 */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🏠 입주 시점 하자 사진 기록 가이드</h2>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 상단 안내 */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-800">
                  입주할 때 집 상태를 사진으로 남겨두면 퇴실 시 원상복구·보증금 분쟁을 효과적으로 예방할 수 있어요.
                  아래 항목을 따라 입주 첫날 촬영해 주세요.
                </p>
              </div>

              {/* 촬영 전 확인사항 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-900 mb-2">📸 촬영 전 꼭 확인하세요</h3>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>• 입주 당일 또는 입주 직후 촬영</li>
                  <li>• 흐리지 않게, 조명 켠 상태로</li>
                  <li>• 하자는 전체 사진 + 확대 사진 함께</li>
                </ul>
              </div>

              {/* 가이드 섹션들 */}
              <div className="space-y-6">
                {/* 1. 집 전체 구조 */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">집 전체 구조 (필수)</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>왜 필요할까요?</strong> 입주 당시 집의 전반적인 상태를 증명할 수 있어요.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">촬영 가이드</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• 현관 → 거실 → 각 방 → 주방 → 화장실 순서</li>
                          <li>• 각 공간당 2~3장</li>
                          <li>• 문을 연 상태 / 닫은 상태 모두 포함</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 벽 · 바닥 · 천장 */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">벽 · 바닥 · 천장 상태</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>왜 필요할까요?</strong> 생활 중 생긴 오염과 기존 하자를 구분할 수 있어요.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">촬영 포인트</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• 벽지 찢김, 얼룩, 변색</li>
                          <li>• 바닥 긁힘, 찍힘, 들뜸</li>
                          <li>• 천장 누수 흔적, 곰팡이</li>
                        </ul>
                        <p className="text-xs text-primary-600 mt-2 font-medium">
                          📌 하자는 반드시 확대 촬영 + 메모 추천
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. 문 · 창문 · 손잡이 */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">문 · 창문 · 손잡이 (분쟁 빈도 높음)</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">촬영 포인트</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• 현관문, 방문, 베란다 창문</li>
                          <li>• 손잡이, 잠금장치, 경첩</li>
                          <li>• 개폐 상태 (열림 / 닫힘)</li>
                        </ul>
                        <p className="text-xs text-primary-600 mt-2 font-medium">
                          🎥 열고 닫을 때 소음이나 뻑뻑함이 있다면 짧은 영상 촬영을 권장해요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. 주방 · 수납장 */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      4
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">주방 · 수납장 내부</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">촬영 포인트</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• 싱크대 상·하부장 내부</li>
                          <li>• 조리대, 타일, 후드</li>
                          <li>• 수납장 문 안쪽 긁힘</li>
                        </ul>
                        <p className="text-xs text-primary-600 mt-2 font-medium">
                          📌 문을 연 상태로 내부까지 촬영하면 좋아요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. 화장실 */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      5
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">화장실 (중요)</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">촬영 포인트</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• 변기, 세면대, 샤워부스</li>
                          <li>• 타일 줄눈, 실리콘 상태</li>
                          <li>• 배수구, 환풍기</li>
                        </ul>
                        <p className="text-xs text-primary-600 mt-2 font-medium">
                          🎥 배수 불량·누수 의심 시 물 내리는 영상 촬영 추천
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. 옵션 가전 */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      6
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">옵션 가전 · 시설물</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">촬영 포인트</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• 에어컨, 보일러, 세탁기, 냉장고</li>
                          <li>• 콘센트, 스위치, 조명, 인터폰</li>
                        </ul>
                        <p className="text-xs text-primary-600 mt-2 font-medium">
                          📌 전원이 켜지는 상태가 보이게 촬영해 주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. 촬영 날짜 증빙 */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      7
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">촬영 날짜 증빙 (꼭!)</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">촬영 가이드</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• 사진 메타데이터(촬영일) 유지</li>
                          <li>• 또는 입주 계약서와 함께 촬영</li>
                        </ul>
                        <p className="text-xs text-primary-600 mt-2 font-medium">
                          📌 서비스에서 촬영일·메모가 자동 저장되면 추후 분쟁 시 증거로 활용하기 좋아요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 좋은 기록의 기준 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  좋은 기록의 기준
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✔</span>
                    <span>전체 + 확대 컷</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✔</span>
                    <span>하자는 메모와 함께</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✔</span>
                    <span>"내 책임일까?" 싶은 건 전부 기록</span>
                  </li>
                </ul>
              </div>

              {/* 하단 강조 */}
              <div className="bg-primary-600 text-white rounded-lg p-5 text-center">
                <p className="text-lg font-bold mb-1">✨ 지금 찍어둔 사진이, 나중에 보증금을 지켜줍니다.</p>
              </div>

              {/* 닫기 버튼 */}
              <div className="flex justify-end">
                <button
                  onClick={() => setIsGuideModalOpen(false)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  확인했습니다
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이슈 기록 모달 */}
      {isIssueRecordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingIssueId ? '이슈 기록 수정' : '이슈 기록 등록'}
              </h3>
              <button
                onClick={handleIssueRecordCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 이미지 미리보기 */}
            {residencyIssueImage && (
              <div className="mb-4">
                <img
                  src={residencyIssueImage}
                  alt="업로드된 사진"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* 이슈 이름 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이슈 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={issueRecordTitle}
                onChange={(e) => setIssueRecordTitle(e.target.value)}
                placeholder="이슈 이름을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                autoFocus
              />
            </div>

            {/* 처리 상태 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                처리 상태
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['처리 중', '접수 완료', '처리 완료', '거절'] as const).map((status) => {
                  const statusColors = {
                    '처리 중': 'bg-yellow-50 border-yellow-300 text-yellow-800',
                    '접수 완료': 'bg-blue-50 border-blue-300 text-blue-800',
                    '처리 완료': 'bg-green-50 border-green-300 text-green-800',
                    '거절': 'bg-red-50 border-red-300 text-red-800'
                  }
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setIssueRecordStatus(status)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        issueRecordStatus === status
                          ? statusColors[status]
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={handleIssueRecordCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleIssueRecordSave}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {editingIssueId ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이슈 타임라인 상세 모달 (A-1 조회) */}
      {isIssueDetailModalOpen && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">이슈 타임라인</h3>
              <button
                onClick={() => {
                  setIsIssueDetailModalOpen(false)
                  setSelectedIssue(null)
                  setSelectedIssueTimelines([])
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-gray-900">{selectedIssue.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{selectedIssue.date}</div>
                  {selectedIssue.lastNotifiedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      마지막 통보: {formatDateTimeShort(selectedIssue.lastNotifiedAt)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setRiskLevelPickerIssueId(selectedIssue.id)}
                    className={`px-2 py-1 rounded border text-xs font-medium ${mapRiskLevelToBadgeClass(selectedIssue.riskLevel)}`}
                  >
                    위험도: {mapRiskLevelToLabel(selectedIssue.riskLevel)}
                  </button>
                  <button
                    type="button"
                    onClick={async () => await createTimelineEvent(selectedIssue.id, 'NOTIFIED', null)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    임대인 통보
                  </button>
                </div>
              </div>
            </div>

            {isTimelinesLoading ? (
              <div className="text-center py-10 text-sm text-gray-500">불러오는 중...</div>
            ) : selectedIssueTimelines.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500">타임라인이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {selectedIssueTimelines.map((t) => (
                  <div key={t.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {mapTimelineEventToKorean(t.eventType)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTimeShort(t.createdAt)}
                      </div>
                    </div>
                    {t.note ? (
                      <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {t.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 타임라인 액션 모달 (A-1 수동 기록) */}
      {timelineActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{timelineActionModal.title}</h3>
              <button
                onClick={() => setTimelineActionModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {timelineActionModal.requireDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">약속 날짜</label>
                <input
                  type="date"
                  value={timelineActionModal.date || ''}
                  onChange={(e) =>
                    setTimelineActionModal((prev) => prev ? { ...prev, date: e.target.value } : prev)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                value={timelineActionModal.note}
                onChange={(e) =>
                  setTimelineActionModal((prev) => prev ? { ...prev, note: e.target.value } : prev)
                }
                rows={4}
                placeholder="내용을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTimelineActionModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const { issueId, eventType, note, date, requireDate } = timelineActionModal
                  if (requireDate && !date) {
                    alert('날짜를 입력해주세요.')
                    return
                  }
                  if (!note.trim()) {
                    alert('메모를 입력해주세요.')
                    return
                  }
                  const finalNote =
                    requireDate
                      ? `약속일: ${date}\n${note.trim()}`
                      : note.trim()
                  await createTimelineEvent(issueId, eventType, finalNote)
                  setTimelineActionModal(null)
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 위험도 선택 모달 (A-3) */}
      {riskLevelPickerIssueId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">분쟁 위험도 설정</h3>
              <button
                onClick={() => setRiskLevelPickerIssueId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={async () => await updateIssueRiskLevel(riskLevelPickerIssueId, 'LOW')}
                className="w-full px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 font-medium"
              >
                LOW (낮음)
              </button>
              <button
                onClick={async () => await updateIssueRiskLevel(riskLevelPickerIssueId, 'MEDIUM')}
                className="w-full px-4 py-2 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 font-medium"
              >
                MEDIUM (보통)
              </button>
              <button
                onClick={async () => await updateIssueRiskLevel(riskLevelPickerIssueId, 'HIGH')}
                className="w-full px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 font-medium"
              >
                HIGH (높음)
              </button>
            </div>
            <button
              onClick={() => setRiskLevelPickerIssueId(null)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 연락/합의 기록 모달 (A-2) */}
      {isAgreementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">연락/합의 기록</h3>
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상대방</label>
                  <select
                    value={agreementCounterpart}
                    onChange={(e) => setAgreementCounterpart(e.target.value as AgreementCounterpart)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="LANDLORD">임대인</option>
                    <option value="MANAGER">관리인</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락 방식</label>
                  <select
                    value={agreementCommunicationType}
                    onChange={(e) => setAgreementCommunicationType(e.target.value as AgreementCommunicationType)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="CALL">통화</option>
                    <option value="MESSAGE">메시지</option>
                    <option value="VISIT">방문</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연결 이슈(선택)</label>
                <select
                  value={agreementLinkedIssueId}
                  onChange={(e) => {
                    setAgreementLinkedIssueId(e.target.value)
                    if (!e.target.value) setAlsoCreatePromisedTimeline(false)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">연결 안 함</option>
                  {defectIssues.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
                </select>
                <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={alsoCreatePromisedTimeline}
                    onChange={(e) => setAlsoCreatePromisedTimeline(e.target.checked)}
                    disabled={!agreementLinkedIssueId}
                    className="w-4 h-4"
                  />
                  <span className={agreementLinkedIssueId ? '' : 'text-gray-400'}>
                    (선택) 이 기록을 해당 이슈 타임라인에 ‘약속(PROMISED)’으로도 남기기
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요약 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={agreementSummary}
                  onChange={(e) => setAgreementSummary(e.target.value)}
                  rows={3}
                  placeholder="핵심 약속/기한/책임 등을 1~3줄로 요약하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsAgreementModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={createAgreementRecord}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
