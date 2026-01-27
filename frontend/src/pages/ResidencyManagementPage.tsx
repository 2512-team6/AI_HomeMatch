import { useState, useRef, useEffect } from 'react'
import { Upload, Calendar, Edit2, Plus, X, Image as ImageIcon, Trash2, Info, CheckCircle } from 'lucide-react'

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
  }
  const [defectIssues, setDefectIssues] = useState<DefectIssue[]>([
    {
      id: '1',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyOC42ODYzIDIwIDI2IDIyLjY4NjMgMjYgMjZDMjYgMjkuMzEzNyAyOC42ODYzIDMyIDMyIDMyQzM1LjMxMzcgMzIgMzggMjkuMzEzNyAzOCAyNkMzOCAyMi42ODYzIDM1LjMxMzcgMjAgMzIgMjBaIiBmaWxsPSIjOUI5Q0E0Ii8+Cjwvc3ZnPgo=',
      title: '침대 프레임 파손',
      date: '2023-10-26',
      status: '처리 중'
    },
    {
      id: '2',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyOC42ODYzIDIwIDI2IDIyLjY4NjMgMjYgMjZDMjYgMjkuMzEzNyAyOC42ODYzIDMyIDMyIDMyQzM1LjMxMzcgMzIgMzggMjkuMzEzNyAzOCAyNkMzOCAyMi42ODYzIDM1LjMxMzcgMjAgMzIgMjBaIiBmaWxsPSIjOUI5Q0E0Ii8+Cjwvc3ZnPgo=',
      title: '화장실 타일 금',
      date: '2023-10-20',
      status: '접수 완료'
    }
  ])
  
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
          status: mapStatusToKorean(r.status)
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

  // 초기 데이터 로드
  useEffect(() => {
    loadContract()
    loadCostSettings()
    loadMonthlyRecords()
    loadDefectIssues()
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

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">거주 중 관리</h1>
        <p className="text-gray-600">
          거주 중 발생하는 하자 관리, 주거비 납부 추적, 퇴실 준비까지 한 번에 관리하세요.
        </p>
      </div>

      {/* Contract Period Registration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">거주 계약 기간</h2>
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
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계약 시작일 (입주일)
                </label>
                <input
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => {
                    setContractStartDate(e.target.value)
                    // 시작일이 변경되면 종료일이 시작일보다 이전이면 자동 조정
                    if (contractEndDate && new Date(contractEndDate) <= new Date(e.target.value)) {
                      const endDate = new Date(e.target.value)
                      endDate.setMonth(endDate.getMonth() + 12) // 기본 1년으로 설정
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
            {contractStartDate && contractEndDate && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  계약 기간: <span className="font-medium text-gray-900">
                    {(() => {
                      const start = new Date(contractStartDate)
                      const end = new Date(contractEndDate)
                      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
                      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                      return `${months}개월 (${days}일)`
                    })()}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDateSave}
                disabled={!contractStartDate || !contractEndDate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setIsEditingDate(false)
                  setContractStartDate(savedContractStartDate)
                  setContractEndDate(savedContractEndDate)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        ) : savedContractStartDate && savedContractEndDate ? (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">등록된 계약 기간</div>
            <div className="text-lg font-bold text-primary-700 mb-2">
              {formatDateShort(savedContractStartDate)} ~ {formatDateShort(savedContractEndDate)}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                {(() => {
                  const start = new Date(savedContractStartDate)
                  const end = new Date(savedContractEndDate)
                  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
                  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                  return `계약 기간: ${months}개월 (${days}일)`
                })()}
              </div>
              <div>
                {(() => {
                  const today = new Date()
                  const end = new Date(savedContractEndDate)
                  const daysRemaining = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  if (daysRemaining > 0) {
                    return `남은 기간: ${daysRemaining}일`
                  } else if (daysRemaining === 0) {
                    return `계약 만료일입니다`
                  } else {
                    return `계약 만료됨 (${Math.abs(daysRemaining)}일 경과)`
                  }
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            거주 계약 기간을 등록해주세요
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* 거주 중 이슈 기록 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">거주 중 이슈 기록</h2>
            <p className="text-sm text-gray-600 mb-4">
              이슈 사진을 업로드하고 AI로 분류하며, 임대인에게 보낼 문서를 자동 생성합니다.
            </p>

            {/* 파일 업로드 영역 */}
            <div
              onDragOver={handleResidencyIssueDragOver}
              onDragLeave={handleResidencyIssueDragLeave}
              onDrop={handleResidencyIssueDrop}
              onClick={() => residencyIssueFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors mb-6 ${
                isResidencyIssueDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                isResidencyIssueDragging ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <p className={`text-gray-600 ${isResidencyIssueDragging ? 'text-primary-600 font-medium' : ''}`}>
                {isResidencyIssueDragging
                  ? '여기에 파일을 놓아주세요'
                  : '사진을 드래그하거나 클릭하여 업로드'}
              </p>
            </div>

            <input
              ref={residencyIssueFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleResidencyIssueFileSelect}
              className="hidden"
            />

            {/* 한줄 메모와 기록하기 버튼 */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={residencyIssueMemo}
                onChange={(e) => setResidencyIssueMemo(e.target.value)}
                placeholder="이슈에 대한 간단한 메모를 입력하세요"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <button
                onClick={handleResidencyIssueSaveOnly}
                disabled={!residencyIssueImage}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
              >
                기록하기
              </button>
            </div>

            {/* 최근 이슈 접수 내역 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">최근 이슈 접수 내역</h2>
              {defectIssues.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  등록된 이슈가 없습니다.
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {defectIssues.map((issue) => {
                    const statusColors = {
                      '처리 중': 'bg-yellow-100 text-yellow-800',
                      '접수 완료': 'bg-blue-100 text-blue-800',
                      '처리 완료': 'bg-green-100 text-green-800',
                      '거절': 'bg-red-100 text-red-800'
                    }

                    return (
                      <div key={issue.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                        <img
                          src={issue.imageUrl}
                          alt={issue.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{issue.title}</div>
                          <div className="text-sm text-gray-600">{issue.date}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[issue.status]}`}>
                          {issue.status}
                        </span>
                        <button
                          onClick={() => handleEditIssue(issue)}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          수정
                        </button>
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
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                임대인 요청 문서 생성
              </button>
            </div>
          </div>



        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {new Date().getMonth() + 1}월 주거비 달력
              </h3>
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
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                주거비 등록
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-700 py-2"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  onClick={() => {
                    const currentRecord = getCurrentMonthRecord()
                    setTempCost({ 
                      ...housingCost, 
                      paymentDate: day,
                      autoRegister: housingCost.autoRegister
                    })
                    setIsCostModalOpen(true)
                  }}
                  className={`text-center py-4 min-h-[48px] rounded cursor-pointer transition-colors ${
                    day === displayCost.paymentDate
                      ? 'bg-primary-100 text-primary-700 font-bold hover:bg-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {day}
                  {day === displayCost.paymentDate && (
                    <div className="text-xs mt-1">납부일</div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600">
              ● 납부일을 클릭하여 주거비를 등록하거나 수정할 수 있습니다.
            </p>
          </div>

          {/* Estimated Cost */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {new Date().getMonth() + 1}월 예상 주거비
            </h3>
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
                <span className="font-bold text-gray-900">
                  총 예상 금액
                </span>
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
            <button 
              onClick={() => setIsHistoryModalOpen(true)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              지난 주거비 내역 보기
            </button>
          </div>
        </div>
      </div>

      {/* Entry Status Records */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            입주 상태 기록
          </h2>
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Info className="w-4 h-4" />
            촬영 가이드 보기
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          입주 당시 집 상태를 기록해 퇴실 시 분쟁을 예방하세요.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 업로드 영역과 하자 목록 통합 */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* 파일 업로드 영역 (맨 왼쪽) */}
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
              {isDragging
                ? '여기에 파일을 놓아주세요'
                : '사진 업로드'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              드래그 또는 클릭
            </p>
          </div>

          {/* 등록된 입주 상태 기록 목록 */}
          {entryStatusRecords.map((record) => (
            <div
              key={record.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
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
    </div>
  )
}
