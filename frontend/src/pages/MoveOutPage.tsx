import { useState, useEffect, useRef } from 'react'
import { Download, Info, FileText, Scale, Check, X, Calendar } from 'lucide-react'
import './MoveOutPage.css'
import { API_BASE } from '../config'

interface EntryStatusRecord {
  id: string
  imageUrl: string
  date: string
  type: string
  description?: string
}

const MODAL_CONTENT = {
  // 분쟁 빈번 항목
  dispute_wallpaper: {
    title: '도배 / 장판 손상',
    description: `도배와 장판은 시간이 지나며 자연스럽게 마모되기 때문에 ‘생활 마모’와 ‘훼손’의 경계에서 분쟁이 자주 발생합니다.

이 경계에서 임대인과 임차인 간 책임 해석 차이로 분쟁이 생기는 경우가 많습니다.`,
    okTitle: '✅ 임차인 책임이 아닌 경우',
    ok: ['햇빛으로 인한 변색', '일상적인 생활로 인한 마모', '가구 배치로 생긴 눌림 자국'],
    riskTitle: '⚠️ 임차인 책임이 될 수 있는 경우',
    risk: ['담배로 인한 그을림', '반려동물로 인한 훼손', '물을 쏟은 뒤 장기간 방치한 경우'],
    tip: `퇴실 전 전체 상태가 보이도록 사진을 촬영해 두는 것이 좋습니다. 손상이 없거나 경미한 부분도 함께 남겨두면 분쟁 예방에 도움이 됩니다.`,
    ctas: [
      { label: '닫기', variant: 'primary', action: 'close' },
    ],
  },
  dispute_kitchen: {
    title: '주방 설비 하자',
    description: `주방 설비는 사용 빈도가 높아 고장 원인이 ‘노후’인지 ‘사용 과실’인지 판단하기 어려운 경우가 많습니다.

정상적인 사용 중 발생한 고장은 임차인 책임이 아닌 경우가 많지만, 사용 방식에 따라 분쟁이 발생할 수 있습니다.`,
    okTitle: '✅ 임차인 책임이 아닌 경우',
    ok: ['노후로 인한 작동 불량', '기본 사용 수명 경과', '정상 사용 중 발생한 자연 고장(입증 가능 시)'],
    riskTitle: '⚠️ 임차인 책임이 될 수 있는 경우',
    risk: ['무리한 힘 사용으로 파손', '고의 분해 또는 개조', '부주의로 인한 누수/파손(예: 과도한 충격)'],
    tip: `퇴실 전 작동 여부를 영상(전원 ON/OFF, 점화, 배수 등)으로 기록해 두는 것이 좋습니다. 문제 발생 시점과 정황을 함께 메모해두면 도움이 됩니다.`,
    ctas: [
      { label: '닫기', variant: 'primary', action: 'close' },
    ],
  },
  dispute_wall: {
    title: '벽걸이 TV / 액자 흔적',
    description: `벽 손상은 구멍의 크기와 개수에 따라 ‘통상적인 사용 범위’인지 여부가 달라질 수 있습니다.

통상 범위를 넘어설 경우 원상복구 비용 분쟁으로 이어질 수 있습니다.`,
    okTitle: '✅ 임차인 책임이 아닌 경우',
    ok: ['작은 못 자국 1~2개(통상 범위로 보는 경우가 많음)', '핀/작은 압정 흔적(범위·상태에 따라 다름)'],
    riskTitle: '⚠️ 임차인 책임이 될 수 있는 경우',
    risk: ['대형 브라켓 설치', '다수의 앙카 구멍', '벽면 균열/파손이 동반된 경우'],
    tip: `벽 전체가 보이도록 사진을 남기고, 구멍의 개수·크기를 근접 촬영으로 함께 기록해 두세요. 필요하면 자(줄자)로 크기 비교 샷을 추가하세요.`,
    ctas: [
      { label: '닫기', variant: 'primary', action: 'close' },
    ],
  },

  // 보증금 3종
  deposit_duty: {
    title: '보증금 반환 의무',
    description: `임대인은 임차인이 퇴실하고 주택을 인도받은 뒤 보증금을 반환해야 할 의무가 있습니다.

통상적으로는 퇴실 후 1개월 이내가 합리적인 반환 기간으로 판단됩니다.`,
    notice: `※ 관리비 정산, 시설 점검 등 합리적인 기간은 인정될 수 있습니다.`,
    ctas: [
      { label: '바로가서 알아보기', variant: 'primary', action: 'molit_guide' },
      { label: '닫기', variant: 'ghost', action: 'close' },
    ],
  },
  deposit_notice: {
    title: '내용증명 발송',
    description: `보증금 반환이 지연될 경우, 임대인에게 내용증명을 발송하여 반환 요청 사실을 공식적으로 남길 수 있습니다.

내용증명은 법적 강제력은 없지만, 임대인에게 심리적 압박을 주고 추후 지급명령 또는 소송 진행 시 중요한 증거 자료로 활용됩니다.`,
    notice: `※ 실제로 내용증명 발송 후 보증금이 반환되는 사례도 많습니다.`,
    ctas: [
      { label: '바로가서 알아보기', variant: 'primary', action: 'epost_guide' },
      { label: '닫기', variant: 'ghost', action: 'close' },
    ],
  },
  deposit_legal: {
    title: '법적 조치 고려',
    description: `내용증명 발송 이후에도 보증금이 반환되지 않는 경우, 지급명령 신청 또는 소액소송을 검토할 수 있습니다.

지급명령은 비교적 간단한 절차로, 임대인이 이의하지 않을 경우 확정 판결과 동일한 효력을 가집니다.`,
    notice: `※ 소송 전 단계에서 해결되는 사례도 많습니다.`,
    ctas: [
      { label: '바로가서 알아보기', variant: 'primary', action: 'scourt_guide' },
      { label: '닫기', variant: 'ghost', action: 'close' },
    ],
  },
}

/** =========================
 *  외부 링크 (공식)
 *  ========================= */
const EXTERNAL_LINKS = {
  molit: 'https://www.molit.go.kr',
  epost: 'https://www.epost.go.kr',
  scourt: 'https://www.scourt.go.kr',
}

/** =========================
 *  공용 모달 (이 페이지 안에서만 사용)
 *  ========================= */
function InfoModal({
  open,
  data,
  onClose,
  onAction,
}: {
  open: boolean
  data: any
  onClose: () => void
  onAction: (action: string) => void
}) {
  if (!open || !data) return null

  const Button = ({ label, variant, action }: { label: string; variant: string; action: string }) => {
    const base = 'w-full py-2 rounded-lg text-sm font-medium'
    const styles =
      variant === 'primary'
        ? 'bg-purple-600 text-white'
        : variant === 'secondary'
          ? 'border border-gray-300 text-gray-800 hover:bg-gray-50'
          : 'text-gray-500 hover:text-gray-700'

    return (
      <button
        className={`${base} ${styles}`}
        onClick={() => {
          if (action === 'close') onClose()
          else onAction(action)
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{data.title}</h2>

        <p className="text-sm text-gray-700 whitespace-pre-line mb-4">{data.description}</p>

        {data.ok && (
          <div className="mb-3">
            <div className="text-sm font-medium text-green-700 mb-1">{data.okTitle ?? '✅ 참고'}</div>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {data.ok.map((v: string, i: number) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {data.risk && (
          <div className="mb-3">
            <div className="text-sm font-medium text-amber-700 mb-1">{data.riskTitle ?? '⚠️ 참고'}</div>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {data.risk.map((v: string, i: number) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {data.tip && <p className="text-xs text-gray-600 whitespace-pre-line mb-3">💡 {data.tip}</p>}

        {data.notice && <p className="text-xs text-gray-500 whitespace-pre-line mb-4">{data.notice}</p>}

        <div className="space-y-2">
          {(data.ctas ?? []).map((b: any, i: number) => (
            <Button key={i} label={b.label} variant={b.variant} action={b.action} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface MoveoutChecklist {
  id: number
  checklistType: string
  itemName: string
  isCompleted: boolean
  completedAt: string | null
  notes: string | null
}

interface HousingContract {
  contractStartDate: string | null
  contractEndDate: string | null
}

interface DepositManagement {
  id: number
  depositAmount: number
  moveoutDate: string | null
  status: string
  expectedReturnDate: string | null
  actualReturnDate: string | null
  returnedAmount: number | null
  deductionAmount: number | null
  deductionReason: string | null
  notes: string | null
}

export default function MoveOutPage() {
  const [modalKey, setModalKey] = useState<string | null>(null)
  const [isScheduleGuideOpen, setIsScheduleGuideOpen] = useState<boolean>(false)
  const [entryStatusRecords, setEntryStatusRecords] = useState<EntryStatusRecord[]>([])
  const [moveoutChecklists, setMoveoutChecklists] = useState<MoveoutChecklist[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isInitializing, setIsInitializing] = useState<boolean>(false)
  const hasInitialized = useRef<boolean>(false)
  // 거주관리 계약 기간 → 퇴실관리 예상 반환일 연동
  const [contract, setContract] = useState<HousingContract | null>(null)
  const [depositManagement, setDepositManagement] = useState<DepositManagement | null>(null)
  const [isSettingExpectedDate, setIsSettingExpectedDate] = useState<boolean>(false)
  
  // API 호출 헬퍼 함수
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    }
  }

  // 체크리스트 불러오기
  const loadChecklists = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return null

      const response = await fetch(`${API_BASE}/api/moveout/checklists`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setMoveoutChecklists(data)
        return data
      }
      return null
    } catch (error) {
      console.error('체크리스트 불러오기 실패:', error)
      return null
    }
  }

  // 체크리스트 항목 업데이트 (자동 저장)
  const updateChecklistItem = async (id: number, isCompleted: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/moveout/checklists/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted })
      })

      if (response.ok) {
        // 성공 시 체크리스트 다시 불러오기
        await loadChecklists()
      } else {
        alert('저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('체크리스트 업데이트 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 체크리스트 생성 (없을 경우)
  const initializeChecklists = async () => {
    // 이미 초기화했거나 초기화 중이면 중복 실행 방지
    if (hasInitialized.current || isInitializing) {
      return
    }
    
    try {
      setIsInitializing(true)
      hasInitialized.current = true
      const token = localStorage.getItem('accessToken')
      if (!token) return

      // 먼저 현재 체크리스트를 다시 확인 (중복 생성 방지)
      const currentChecklists = await loadChecklists()
      if (currentChecklists && currentChecklists.length > 0) {
        // 이미 체크리스트가 있으면 생성하지 않음
        return
      }

      const moveOutItems = [
        '전기 요금 해지 및 정산',
        '가스 요금 해지 및 정산',
        '수도 요금 정산',
        '인터넷 / TV 해지',
        '열쇠 반납 및 도어락 초기화',
      ]

      const restorationItems = [
        '바닥재 오염 및 파손 점검',
        '붙박이 가구 기능 점검',
        '창문 및 문 파손 여부',
        '벽지 손상 여부 확인',
        '조명·콘센트·스위치 정상 작동',
      ]

      // 체크리스트 생성 (순차적으로 실행)
      for (const item of moveOutItems) {
        await fetch(`${API_BASE}/api/moveout/checklists`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            checklistType: 'MOVE_OUT',
            itemName: item,
            isCompleted: false
          })
        })
      }

      for (const item of restorationItems) {
        await fetch(`${API_BASE}/api/moveout/checklists`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            checklistType: 'RESTORATION',
            itemName: item,
            isCompleted: false
          })
        })
      }

      // 생성 후 다시 불러오기
      await loadChecklists()
    } catch (error) {
      console.error('체크리스트 초기화 실패:', error)
      hasInitialized.current = false // 실패 시 다시 시도할 수 있도록
    } finally {
      setIsInitializing(false)
    }
  }

  // 거주관리 계약 기간 불러오기 (예상 반환일 연동용)
  const loadContract = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const response = await fetch(`${API_BASE}/api/residency/contract`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setContract({
          contractStartDate: data.contractStartDate || null,
          contractEndDate: data.contractEndDate || null
        })
      }
    } catch (error) {
      console.error('계약 기간 불러오기 실패:', error)
    }
  }

  // 보증금 관리 불러오기 (예상 반환일 표시/설정용)
  const loadDepositManagement = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const response = await fetch(`${API_BASE}/api/moveout/deposit-management`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setDepositManagement(data)
      } else {
        setDepositManagement(null)
      }
    } catch (error) {
      console.error('보증금 관리 불러오기 실패:', error)
      setDepositManagement(null)
    }
  }

  // 계약 종료일을 예상 반환일로 설정 (보증금 관리 레코드가 있을 때만)
  const setExpectedReturnDateFromContract = async () => {
    if (!depositManagement || !contract?.contractEndDate) return
    try {
      setIsSettingExpectedDate(true)
      const response = await fetch(
        `${API_BASE}/api/moveout/deposit-management/${depositManagement.id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ expectedReturnDate: contract.contractEndDate })
        }
      )
      if (response.ok) {
        await loadDepositManagement()
        alert('예상 반환일이 계약 종료일로 설정되었습니다.')
      } else {
        alert('설정에 실패했습니다.')
      }
    } catch (error) {
      console.error('예상 반환일 설정 실패:', error)
      alert('설정 중 오류가 발생했습니다.')
    } finally {
      setIsSettingExpectedDate(false)
    }
  }

  // 입주 상태 기록 불러오기 (API에서)
  const loadEntryStatusRecords = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`${API_BASE}/api/moveout/entry-status-records`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const records: EntryStatusRecord[] = data.map((record: any) => ({
          id: record.id.toString(),
          imageUrl: record.imageUrl,
          date: record.recordDate,
          type: record.recordType,
          description: record.description
        }))
        setEntryStatusRecords(records)
      } else if (response.status === 404) {
        // 기록이 없으면 빈 배열로 설정
        setEntryStatusRecords([])
      }
    } catch (error) {
      console.error('입주 상태 기록 불러오기 실패:', error)
    }
  }

  // 입주 상태 기록 불러오기
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      loadEntryStatusRecords()
    }
  }, [])

  // 거주관리 계약 기간·보증금 관리 불러오기 (예상 반환일 연동)
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      loadContract()
      loadDepositManagement()
    }
  }, [])

  // 체크리스트 불러오기 및 초기화
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      loadChecklists().then((data) => {
        // 체크리스트가 없으면 초기화
        if (!data || data.length === 0) {
          initializeChecklists()
        }
      })
    }
  }, [])
  
  const formatDateShort = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 이미지 다운로드 함수
  const handleDownloadImage = async (imageUrl: string, statusType: string, date: string) => {
    try {
      // 이미지를 fetch로 가져오기
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Blob URL 생성
      const blobUrl = window.URL.createObjectURL(blob)
      
      // 다운로드 링크 생성
      const link = document.createElement('a')
      link.href = blobUrl
      
      // 파일명 생성 (입주 상태 종류_날짜 형식)
      const formattedDate = date ? new Date(date).toISOString().split('T')[0] : 'unknown'
      const fileName = `${statusType}_${formattedDate}.jpg`.replace(/[^a-zA-Z0-9._-]/g, '_')
      
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      
      // 정리
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('이미지 다운로드 실패:', error)
      alert('이미지 다운로드에 실패했습니다.')
    }
  }

  const openModal = (key: string) => setModalKey(key)
  const closeModal = () => setModalKey(null)

  // CTA 액션: 공식 링크로 이동
  const handleModalAction = (action: string) => {
    if (action === 'molit_guide') {
      window.open(EXTERNAL_LINKS.molit, '_blank')
      closeModal()
      return
    }

    if (action === 'epost_guide') {
      window.open(EXTERNAL_LINKS.epost, '_blank')
      closeModal()
      return
    }

    if (action === 'scourt_guide') {
      window.open(EXTERNAL_LINKS.scourt, '_blank')
      closeModal()
      return
    }

    // 분쟁 항목 가이드 CTA들은 현재는 콘솔만 남기고 닫기(앱 구조에 맞게 연결 가능)
    console.log('[CTA action]', action)
    closeModal()
  }

  const modalData = modalKey ? (MODAL_CONTENT as any)[modalKey] : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">퇴실 & 분쟁 예방</h1>
      </div>

      {/* Move-in Records */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">입주 기록</h2>
        <p className="text-sm text-gray-600 mb-4">
          입주 시 촬영한 사진과 서류를 확인하고, 새로운 기록을 추가하여 분쟁 발생 시 증거 자료로 활용하세요.
        </p>
        {entryStatusRecords.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-2">등록된 입주 기록이 없습니다.</p>
            <p className="text-sm text-gray-400">
              거주 중 관리 페이지에서 입주 상태 사진을 등록하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-10">
            {entryStatusRecords.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <img
                  src={record.imageUrl}
                  alt={record.type}
                  className="w-full h-48 object-cover rounded mb-3 border border-gray-200"
                />
                <div className="font-medium text-gray-900 text-sm mb-1">{record.type}</div>
                <div className="text-xs text-gray-600 mb-2">{formatDateShort(record.date)}</div>
                <button 
                  onClick={() => handleDownloadImage(record.imageUrl, record.type, record.date)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>다운로드</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Move-out Preparation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">퇴실 준비</h2>
        <p className="text-sm text-gray-600 mb-6">
          퇴실 전 필수 절차와 원상복구 상태를 함께 점검하세요.
        </p>

        <div className="grid md:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 ml-1">퇴실 체크리스트</h3>
              <button
                onClick={() => setIsScheduleGuideOpen(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>가이드</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {moveoutChecklists
                .filter(item => item.checklistType === 'MOVE_OUT')
                .map((item) => (
                  <label
                    key={item.id}
                    className={`
                      group
                      flex items-center justify-between
                      rounded-lg
                      px-4 py-3
                      cursor-pointer
                      transition-colors
                      ${item.isCompleted ? 'bg-indigo-200' : 'bg-slate-100'}
                      hover:bg-indigo-200
                    `}
                  >
                    {/* 텍스트 */}
                    <span
                      className={`
                        text-sm
                        ${item.isCompleted ? 'font-semibold text-black' : 'text-gray-800'}
                      `}
                    >
                      {item.itemName}
                    </span>

                    {/* 체크박스 */}
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={(e) => updateChecklistItem(item.id, e.target.checked)}
                      disabled={isLoading}
                      className="
                        w-4 h-4
                        accent-indigo-600
                        cursor-pointer
                        disabled:opacity-50
                      "
                    />
                  </label>
                ))}
              {moveoutChecklists.filter(item => item.checklistType === 'MOVE_OUT').length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  체크리스트를 불러오는 중...
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-4 ml-1">원상복구 체크리스트</h3>

            <div className="space-y-3.5">
              {moveoutChecklists
                .filter(item => item.checklistType === 'RESTORATION')
                .map((item) => (
                  <label
                    key={item.id}
                    className={`
                      group
                      flex items-center justify-between
                      rounded-lg
                      px-4 py-3
                      cursor-pointer
                      transition-colors
                      ${item.isCompleted ? 'bg-indigo-200' : 'bg-slate-100'}
                      hover:bg-indigo-200
                    `}
                  >
                    {/* 텍스트 */}
                    <span
                      className={`
                        text-sm
                        ${item.isCompleted ? 'font-semibold text-black' : 'text-gray-800'}
                      `}
                    >
                      {item.itemName}
                    </span>

                    {/* 체크박스 */}
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={(e) => updateChecklistItem(item.id, e.target.checked)}
                      disabled={isLoading}
                      className="
                        w-4 h-4
                        accent-indigo-600
                        cursor-pointer
                        disabled:opacity-50
                      "
                    />
                  </label>
                ))}
              {moveoutChecklists.filter(item => item.checklistType === 'RESTORATION').length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  체크리스트를 불러오는 중...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 분쟁 빈번 항목 */}
        <div
          className=" rounded-lg p-4 mt-6 bg-rose-50 ">
          <h3
            className=" font-bold text-rose-800 mb-3 flex items-center gap-2 ">
            <Info className="w-4 h-4 animate-pulse text-rose-500" />
            분쟁 빈번 항목
          </h3>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              { label: '도배/장판 손상', key: 'dispute_wallpaper' },
              { label: '주방 설비 하자', key: 'dispute_kitchen' },
              { label: '벽걸이 TV/액자 흔적', key: 'dispute_wall' },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => openModal(item.key)}
                className="
                  flex items-center justify-between
                  p-3
                  border border-rose-200
                  rounded
                  bg-white
                  cursor-pointer
                "
              >
                <span className="text-sm text-rose-800">
                  {item.label}
                </span>
                <Info className="w-4 h-4 text-rose-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deposit Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">보증금 관리</h2>
        <p className="text-sm text-gray-600 mb-4">
          보증금 반환 진행 상황을 확인하고, 지연 시 대처 방안을 미리 숙지하세요.
        </p>

        {/* 상태바 (수정됨) */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-4">반환 타임라인</h3>

          <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full"
              style={{ width: '66%' }}
            />
          </div>

          <div className="flex justify-between text-sm mb-4">
            {[
              { label: '퇴실 완료', done: true },
              { label: '정산 완료', done: true },
              { label: '반환 대기', done: false },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                    s.done ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  {s.done && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={s.done ? 'font-bold text-purple-600' : 'text-gray-500'}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-700">
            현재: 정산 중<br />
            예상 반환일:{' '}
            {depositManagement?.expectedReturnDate
              ? formatDateShort(depositManagement.expectedReturnDate)
              : contract?.contractEndDate
                ? (
                  <>
                    <span className="text-gray-600">
                      {formatDateShort(contract.contractEndDate)}
                      <span className="ml-1 text-xs">(거주관리 계약 종료일 기준)</span>
                    </span>
                    {depositManagement && (
                      <button
                        type="button"
                        onClick={setExpectedReturnDateFromContract}
                        disabled={isSettingExpectedDate}
                        className="ml-2 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isSettingExpectedDate ? '설정 중…' : depositManagement?.expectedReturnDate ? '계약 종료일로 변경' : '이 날짜로 예상 반환일 설정'}
                      </button>
                    )}
                  </>
                )
                : '— (거주관리에서 계약 기간을 등록하면 여기에 표시됩니다)'}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => openModal('deposit_duty')}
          >
            <Info className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-bold text-gray-900 text-sm mb-1">보증금 반환 의무</h4>
            <p className="text-xs text-gray-600">임대인은 퇴실과 동시에 보증금을 반환해야 할 의무가 있습니다.</p>
          </div>
          <div
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => openModal('deposit_notice')}
          >
            <FileText className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-bold text-gray-900 text-sm mb-1">내용증명 발송</h4>
            <p className="text-xs text-gray-600">지연 시 보증금 반환 요청 내용증명을 발송하여 증거를 확보하세요.</p>
          </div>
          <div
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => openModal('deposit_legal')}
          >
            <Scale className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-bold text-gray-900 text-sm mb-1">법적 조치 고려</h4>
            <p className="text-xs text-gray-600">
              내용증명에도 불구하고 반환이 지연되면 지급명령 등 법적 조치를 고려할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 법적 참조 데이터 (수정됨) */}
        <div className="border border-purple-200 rounded-lg p-4">
          <h4 className="font-bold text-gray-900 text-sm mb-3">법적 참조 데이터</h4>
          <div className="space-y-3 text-sm">
            {[
              ['평균 보증금 반환 기간', '퇴실 후 1개월 이내'],
              ['지연 이자율 (법정)', '연 5% (소송 시 연 12%)'],
              ['주택임대차보호법 제3조의3', '임차인의 우선변제권 규정'],
            ].map(([label, value], idx) => (
              <div key={idx} className="flex justify-between border-b last:border-0 pb-2">
                <span className="text-gray-600">{label}</span>
                <span className="font-mono text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 모달 렌더 */}
      <InfoModal open={!!modalKey} data={modalData} onClose={closeModal} onAction={handleModalAction} />

      {/* 퇴실 준비 일정 가이드 모달 */}
      {isScheduleGuideOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🚪 퇴실 준비 일정 가이드</h2>
              <button
                onClick={() => setIsScheduleGuideOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 상단 안내 */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-800">
                  퇴실 예정일 기준으로 꼭 필요한 절차만 시간순으로 정리했어요.
                  체크리스트를 따라 하나씩 완료해 보세요.
                </p>
              </div>

              {/* 퇴실 준비 일정 타임라인 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  퇴실 준비 일정 (타임라인)
                </h3>

                <div className="space-y-4">
                  {/* D-7 */}
                  <div className="border-l-4 border-primary-500 pl-4 py-3 bg-primary-50 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs font-bold rounded">D-7</span>
                      <span className="text-xs font-medium text-primary-700">(필수)</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">도시가스 · 전기 · 수도 해지 신청</h4>
                    <ul className="space-y-1 text-sm text-gray-700 mb-2">
                      <li>• 사용 종료일 기준 해지</li>
                      <li>• 정산 요금 확인</li>
                    </ul>
                    <button className="text-xs text-primary-600 hover:underline font-medium">👉 바로가기</button>
                    <p className="text-xs text-gray-500 mt-2">ℹ️ 계량기 최종 수치는 퇴실 직전에 촬영하면 좋아요.</p>
                  </div>

                  {/* D-3 (필수) */}
                  <div className="border-l-4 border-primary-500 pl-4 py-3 bg-primary-50 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs font-bold rounded">D-3</span>
                      <span className="text-xs font-medium text-primary-700">(필수)</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">인터넷 / TV 해지 또는 이전 예약</h4>
                    <ul className="space-y-1 text-sm text-gray-700 mb-2">
                      <li>• 장비 반납 일정 확인</li>
                      <li>• 위약금 발생 여부 확인</li>
                    </ul>
                    <button className="text-xs text-primary-600 hover:underline font-medium">👉 바로가기</button>
                    <p className="text-xs text-gray-500 mt-2">ℹ️ 당일 해지가 어려운 경우가 많아요.</p>
                  </div>

                  {/* D-3 (중요) */}
                  <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded">D-3</span>
                      <span className="text-xs font-medium text-amber-700">(중요)</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">청소 · 원상복구 상태 점검</h4>
                    <ul className="space-y-1 text-sm text-gray-700 mb-2">
                      <li>• 기본 청소 (주방, 욕실, 바닥)</li>
                      <li>• 입주 시 기록한 하자와 비교</li>
                      <li>• 추가 수리 필요 여부 확인</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">ℹ️ 입주 사진 기록이 있으면 판단이 쉬워요.</p>
                  </div>

                  {/* D-2 */}
                  <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded">D-2</span>
                      <span className="text-xs font-medium text-amber-700">(중요 · 분쟁 예방)</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">퇴실 전 상태 사진 촬영</h4>
                    <ul className="space-y-1 text-sm text-gray-700 mb-2">
                      <li>• 집 전체 구조</li>
                      <li>• 청소·수리 완료 상태</li>
                      <li>• 벽·바닥·설비 주요 부분</li>
                      <li>• 가스·전기·수도 계량기 수치</li>
                    </ul>
                    <button className="text-xs text-primary-600 hover:underline font-medium">👉 촬영 가이드 보기</button>
                    <p className="text-xs text-gray-500 mt-2">ℹ️ 보증금 분쟁 예방에 가장 중요한 단계예요.</p>
                  </div>

                  {/* D-1 */}
                  <div className="border-l-4 border-primary-500 pl-4 py-3 bg-primary-50 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs font-bold rounded">D-1</span>
                      <span className="text-xs font-medium text-primary-700">(필수)</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">거주지 이전 신고 · 확정일자 처리</h4>
                    <ul className="space-y-1 text-sm text-gray-700 mb-2">
                      <li>• 전입신고 이전</li>
                      <li>• 확정일자 이전 또는 말소 확인</li>
                    </ul>
                    <button className="text-xs text-primary-600 hover:underline font-medium">👉 바로가기</button>
                    <p className="text-xs text-gray-500 mt-2">ℹ️ 보증금 보호와 직접 관련된 절차예요.</p>
                  </div>

                  {/* D-Day */}
                  <div className="border-l-4 border-red-500 pl-4 py-3 bg-red-50 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">D-Day</span>
                      <span className="text-xs font-medium text-red-700">(퇴실 당일)</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">열쇠 반납 및 퇴실 확인</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• 열쇠 / 카드키 반납</li>
                      <li>• 임대인과 퇴실 상태 확인</li>
                      <li>• 보증금 반환 일정 재확인</li>
                    </ul>
                  </div>

                  {/* D+7 ~ D+14 */}
                  <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded">D+7 ~ D+14</span>
                      <span className="text-xs font-medium text-amber-700">(중요)</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">보증금 반환 확인</h4>
                    <ul className="space-y-1 text-sm text-gray-700 mb-2">
                      <li>• 계약서 기준 반환 기한 확인</li>
                      <li>• 미반환 시 대응 절차 확인</li>
                    </ul>
                    <button className="text-xs text-primary-600 hover:underline font-medium">👉 반환 기준 보기</button>
                  </div>
                </div>
              </div>

              {/* 자주 발생하는 분쟁 포인트 */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <h3 className="font-bold text-rose-900 mb-3">⚠️ 자주 발생하는 분쟁 포인트</h3>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-rose-800">
                    <span>•</span>
                    <span>도배 / 장판 손상</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-rose-800">
                    <span>•</span>
                    <span>주방 설비 하자</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-rose-800">
                    <span>•</span>
                    <span>벽걸이 TV · 액자 흔적</span>
                  </div>
                </div>
                <p className="text-xs text-rose-700">
                  👉 퇴실 전 사진과 입주 기록이 있으면 대부분 예방할 수 있어요.
                </p>
              </div>

              {/* 하단 강조 */}
              <div className="bg-primary-600 text-white rounded-lg p-5 text-center">
                <p className="text-lg font-bold">✨ 기록해두면, 보증금을 지킬 수 있어요.</p>
              </div>

              {/* 닫기 버튼 */}
              <div className="flex justify-end">
                <button
                  onClick={() => setIsScheduleGuideOpen(false)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  확인했습니다
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}