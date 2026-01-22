import { useState } from 'react'
import { Download, Info, FileText, Scale, Check } from 'lucide-react'

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
      { label: '보증금 반환 요청 절차 보기', variant: 'primary', action: 'deposit_guide' },
      { label: '닫기', variant: 'ghost', action: 'close' },
    ],
  },
  deposit_notice: {
    title: '내용증명 발송',
    description: `보증금 반환이 지연될 경우, 임대인에게 내용증명을 발송하여 반환 요청 사실을 공식적으로 남길 수 있습니다.

내용증명은 법적 강제력은 없지만, 임대인에게 심리적 압박을 주고 추후 지급명령 또는 소송 진행 시 중요한 증거 자료로 활용됩니다.`,
    notice: `※ 실제로 내용증명 발송 후 보증금이 반환되는 사례도 많습니다.`,
    ctas: [
      { label: '내용증명 자동 작성하기', variant: 'primary', action: 'auto_letter' },
      { label: '작성 예시 먼저 보기', variant: 'secondary', action: 'letter_sample' },
      { label: '닫기', variant: 'ghost', action: 'close' },
    ],
  },
  deposit_legal: {
    title: '법적 조치 고려',
    description: `내용증명 발송 이후에도 보증금이 반환되지 않는 경우, 지급명령 신청 또는 소액소송을 검토할 수 있습니다.

지급명령은 비교적 간단한 절차로, 임대인이 이의하지 않을 경우 확정 판결과 동일한 효력을 가집니다.`,
    notice: `※ 소송 전 단계에서 해결되는 사례도 많습니다.`,
    ctas: [
      { label: '지급명령 절차 한눈에 보기', variant: 'primary', action: 'legal_guide' },
      { label: '닫기', variant: 'ghost', action: 'close' },
    ],
  },
}

/** =========================
 *  외부 링크 (공식)
 *  ========================= */
const EXTERNAL_LINKS = {
  depositGuide: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=683',
  contentProof: 'https://www.epost.go.kr/service/service_01_04.jsp',
  paymentOrder: 'https://help.scourt.go.kr/nm/minwon/PaymentOrderGuide.jsp',
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

export default function MoveOutPage() {
  const [modalKey, setModalKey] = useState<string | null>(null)

  const openModal = (key: string) => setModalKey(key)
  const closeModal = () => setModalKey(null)

  // CTA 액션: 공식 링크로 이동
  const handleModalAction = (action: string) => {
    if (action === 'deposit_guide') {
      window.open(EXTERNAL_LINKS.depositGuide, '_blank')
      closeModal()
      return
    }

    if (action === 'auto_letter' || action === 'letter_sample') {
      window.open(EXTERNAL_LINKS.contentProof, '_blank')
      closeModal()
      return
    }

    if (action === 'legal_guide') {
      window.open(EXTERNAL_LINKS.paymentOrder, '_blank')
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
        <div className="grid md:grid-cols-4 gap-10">
          {[
            { title: '거실 입주 사진', date: '2023-01-01' },
            { title: '주방 입주 사진', date: '2023-01-01' },
            { title: '욕실 입주 사진', date: '2023-01-01' },
            { title: '계약서 스캔본', date: '2023-01-01' },
          ].map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="w-full h-48 bg-gray-200 rounded mb-3"></div>
              <div className="font-medium text-gray-900 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-600 mb-2">{item.date}</div>
              <button className="w-full flex items-center justify-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Download className="w-4 h-4" />
                <span>다운로드</span>
              </button>
            </div>
          ))}
        </div>
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
            <h3 className="font-bold text-gray-900 mb-4 ml-1">퇴실 체크리스트</h3>

            <div className="space-y-3.5">
              {[
                '전기 요금 해지 및 정산',
                '가스 요금 해지 및 정산',
                '수도 요금 정산',
                '인터넷 / TV 해지',
                '열쇠 반납 및 도어락 초기화',
              ].map((item, idx) => (
                <label
                  key={idx}
                  className="
                    group
                    flex items-center justify-between
                    rounded-lg
                    px-4 py-3
                    cursor-pointer
                    transition-colors

                    bg-slate-100
                    hover:bg-indigo-200
                    has-[:checked]:bg-indigo-200
                  "
                >
                  {/* 텍스트 */}
                  <span
                    className="
                      text-sm text-gray-800
                      group-has-[:checked]:font-semibold
                      group-has-[:checked]:text-black
                    "
                  >
                    {item}
                  </span>

                  {/* 체크박스 */}
                  <input
                    type="checkbox"
                    className="
                      w-4 h-4
                      accent-indigo-600
                      cursor-pointer
                    "
                  />
                </label>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-4 ml-1">원상복구 체크리스트</h3>

            <div className="space-y-3.5">
              {[
                '바닥재 오염 및 파손 점검',
                '붙박이 가구 기능 점검',
                '창문 및 문 파손 여부',
                '벽지 손상 여부 확인',
                '조명·콘센트·스위치 정상 작동',
              ].map((item, idx) => (
                <label
                  key={idx}
                  className="
                    group
                    flex items-center justify-between
                    rounded-lg
                    px-4 py-3
                    cursor-pointer
                    transition-colors

                    bg-slate-100
                    hover:bg-indigo-200
                    has-[:checked]:bg-indigo-200
                  "
                >
                  {/* 텍스트 */}
                  <span
                    className="
                      text-sm text-gray-800
                      group-has-[:checked]:font-semibold
                      group-has-[:checked]:text-black
                    "
                  >
                    {item}
                  </span>

                  {/* 체크박스 */}
                  <input
                    type="checkbox"
                    className="
                      w-4 h-4
                      accent-indigo-600
                      cursor-pointer
                    "
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 ml-1">
            퇴실 준비 일정
          </h3>
          <p className="text-sm text-gray-600 mb-4 ml-1">
            퇴실 예정일 기준으로 꼭 필요한 절차만 정리했어요.
          </p>

          <div className="space-y-3">
            {[
              { dday: 'D-7', task: '도시가스 · 전기 · 수도 해지 신청' },
              { dday: 'D-3', task: '인터넷 / TV 해지 예약' },
              { dday: 'D-1', task: '거주지 이전 및 확정일자 신고' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="
                  flex items-center justify-between
                  px-4 py-3
                  rounded-lg
                  bg-slate-50
                  hover:bg-indigo-50
                  transition-colors
                "
              >
                <div>
                  <div className="text-xs font-bold text-indigo-600 mb-0.5">
                    {item.dday}
                  </div>
                  <div className="text-sm text-gray-900">
                    {item.task}
                  </div>
                </div>

                <button className="text-sm font-medium text-indigo-600 hover:underline">
                  바로가기
                </button>
              </div>
            ))}
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
            예상 반환일: 2024-08-15
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
    </div>
  )
}