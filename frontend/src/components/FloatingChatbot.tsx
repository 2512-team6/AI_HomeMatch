import { useState, useEffect, useRef } from 'react'
import { X, Send, Minimize2, FileText, Scale, Home, Package } from 'lucide-react'
import logoHouseImage from '../assets/logo_house.png'

export type ChatTopic = 'contract_review' | 'deed_analysis' | 'residency' | 'moveout' | null

const TOPICS: { key: ChatTopic; label: string; short: string; icon: typeof FileText }[] = [
  { key: 'contract_review', label: '계약서 점검', short: '계약서', icon: FileText },
  { key: 'deed_analysis', label: '등기부등본', short: '등기부등본', icon: Scale },
  { key: 'residency', label: '거주관리', short: '거주', icon: Home },
  { key: 'moveout', label: '퇴실관리', short: '퇴실', icon: Package },
]

interface Message {
  id: number
  type: 'user' | 'bot'
  text: string
  timestamp?: Date
}

interface ChatbotMessageResponse {
  id: number
  type: string
  text: string
  timestamp: string
}

const WELCOME_NO_TOPIC = "안녕하세요. 궁금한 게 있으면 입력창을 눌러 주제만 골라 주시면 바로 안내해 드릴게요."

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic>(null)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: WELCOME_NO_TOPIC, timestamp: new Date() },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<{ label: string }[]>([])
  const [hasSentMessageInCurrentTopic, setHasSentMessageInCurrentTopic] = useState(false)
  const messagesScrollRef = useRef<HTMLDivElement>(null)

  // 봇 답변 가독성 향상을 위한 렌더링 헬퍼
  const renderBotMessageText = (text: string) => {
    // 줄 단위로 나눈 뒤, 번호/불릿/일반 문장을 구분해서 렌더링
    const rawLines = text.split('\n')
    const lines = rawLines.map((line) => line.trim()).filter((line) => line.length > 0)

    const blocks: JSX.Element[] = []

    let listBuffer: string[] = []

    const flushList = () => {
      if (!listBuffer.length) return
      blocks.push(
        <ul key={`list-${blocks.length}`} className="list-disc list-inside space-y-1 pl-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )
      listBuffer = []
    }

    // 첫 줄은 제목/요약일 가능성이 높으니 따로 처리
    lines.forEach((line, index) => {
      const numbered = line.match(/^(\d+)[\.\)]\s*(.*)$/)
      const bulleted = line.match(/^[-•]\s*(.*)$/)

      if (numbered || bulleted) {
        const content = numbered ? numbered[2] || numbered[0] : bulleted?.[1] || line
        listBuffer.push(content)
        return
      }

      // 리스트가 끝났으면 먼저 플러시
      if (listBuffer.length) {
        flushList()
      }

      const isNote =
        /^[(（].*[)）]$/.test(line) ||
        line.startsWith('※') ||
        line.startsWith('참고') ||
        line.includes('참고:')

      // 특정 키워드 강조용 헬퍼
      const highlightKeywords = (content: string) => {
        const KEYWORDS = ['보증금', '대항력', '우선변제권']
        const parts: JSX.Element[] = []

        let remaining = content
        let key = 0

        while (remaining.length > 0) {
          let earliestIndex = -1
          let matched = ''

          for (const kw of KEYWORDS) {
            const idx = remaining.indexOf(kw)
            if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
              earliestIndex = idx
              matched = kw
            }
          }

          if (earliestIndex === -1) {
            parts.push(
              <span key={key++}>
                {remaining}
              </span>
            )
            break
          }

          if (earliestIndex > 0) {
            parts.push(
              <span key={key++}>
                {remaining.slice(0, earliestIndex)}
              </span>
            )
          }

          parts.push(
            <span key={key++} className="font-semibold text-primary-700">
              {matched}
            </span>
          )

          remaining = remaining.slice(earliestIndex + matched.length)
        }

        return parts
      }

      // 첫 번째 줄은 제목/요약 느낌으로 조금 더 강조
      if (index === 0 && !numbered && !bulleted && !isNote) {
        blocks.push(
          <p
            key={`p-${index}`}
            className="text-sm font-semibold text-gray-900 whitespace-pre-wrap mb-1"
          >
            {highlightKeywords(line)}
          </p>
        )
        return
      }

      blocks.push(
        <p
          key={`p-${index}`}
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isNote ? 'text-gray-500 mt-1' : ''
          }`}
        >
          {highlightKeywords(line)}
        </p>
      )
    })

    // 마지막에 남은 리스트 처리
    flushList()

    return <div className="space-y-1">{blocks}</div>
  }

  // 주제 선택 시 해당 주제 추천 질문 로드 + 이 주제에서는 아직 질문 안 함으로 리셋
  useEffect(() => {
    if (!selectedTopic) {
      setSuggestedQuestions([])
      setHasSentMessageInCurrentTopic(false)
      return
    }
    setHasSentMessageInCurrentTopic(false)
    fetch(`http://localhost:8080/api/chatbot/suggested-questions?topic=${selectedTopic}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: { label: string }[]) => setSuggestedQuestions(Array.isArray(list) ? list : []))
      .catch(() => setSuggestedQuestions([]))
  }, [selectedTopic])

  // 챗봇 열릴 때·메시지 바뀔 때마다 최근 대화(하단)로 스크롤
  useEffect(() => {
    if (!isOpen || isMinimized) return
    const id = setTimeout(() => {
      const el = messagesScrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 0)
    return () => clearTimeout(id)
  }, [isOpen, isMinimized, messages])

  // 로그아웃 시 채팅 리셋
  useEffect(() => {
    const handleReset = () => {
      setMessages([{ id: 1, type: 'bot', text: WELCOME_NO_TOPIC, timestamp: new Date() }])
      setSelectedTopic(null)
    }
    window.addEventListener('chat-reset', handleReset)
    return () => window.removeEventListener('chat-reset', handleReset)
  }, [])

  // 챗봇을 닫았다가 다시 열 때마다 지난 채팅 리셋 → 새 대화로 시작 (로그인 기반 기록 안 씀)
  useEffect(() => {
    if (isOpen) {
      setMessages([{ id: 1, type: 'bot', text: WELCOME_NO_TOPIC, timestamp: new Date() }])
      setSelectedTopic(null)
    }
  }, [isOpen])

  const handlePickTopic = (key: ChatTopic) => {
    if (!key) return
    setSelectedTopic(key)
    setInputFocused(true)
    const t = TOPICS.find((x) => x.key === key)
    const welcomeForTopic = t
      ? `${t.label} 쪽으로 궁금한 걸 적어 주세요. 가이드 기준으로 참고 안내해 드릴게요.`
      : '궁금한 걸 적어 주세요.'
    setMessages((prev) =>
      prev.length <= 1
        ? [...prev, { id: Date.now(), type: 'bot' as const, text: welcomeForTopic, timestamp: new Date() }]
        : prev
    )
  }

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return
    setHasSentMessageInCurrentTopic(true)
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      text: messageText.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) throw new Error('로그인이 필요합니다.')
      const response = await fetch('http://localhost:8080/api/chatbot/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: messageText.trim(), topic: selectedTopic ?? undefined }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }))
        throw new Error(errorData.error || '메시지 전송에 실패했습니다.')
      }
      const botResponse: ChatbotMessageResponse = await response.json()
      const botMessage: Message = {
        id: botResponse.id || Date.now(),
        type: 'bot',
        text: botResponse.text,
        timestamp: botResponse.timestamp ? new Date(botResponse.timestamp) : new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      const errorMessage: Message = {
        id: Date.now(),
        type: 'bot',
        text: error instanceof Error ? error.message : '메시지 전송 중 오류가 발생했습니다.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return
    const text = inputText.trim()
    setInputText('')
    await sendMessageWithText(text)
  }

  const handleSuggestedQuestionClick = (label: string) => {
    sendMessageWithText(label)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date?: Date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          setIsMinimized(false)
        }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        aria-label="챗봇 열기"
      >
        <img
          src={logoHouseImage}
          alt="챗봇"
          className="w-10 h-10 object-contain group-hover:scale-110 transition-transform brightness-0 invert"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full"></span>
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-[calc(100vw-3rem)] md:w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[420px] md:h-[520px] max-h-[75vh]'
      }`}
    >
      {/* Header */}
      <div className="bg-primary-600 text-white rounded-t-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={logoHouseImage} 
            alt="챗봇" 
            className="w-8 h-8 object-contain brightness-0 invert" 
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <h3 className="font-bold text-sm">Home'Scan AI</h3>
            <p className="text-xs text-primary-100">실시간 도움말</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-primary-700 rounded-lg transition-colors"
            aria-label={isMinimized ? '최대화' : '최소화'}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-primary-700 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div
            ref={messagesScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col min-h-0"
          >
            {/* 메시지 목록 — 열 때·추가 시 항상 최근(하단)부터 보이게 스크롤 */}
            <div className="space-y-4 flex-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      {message.type === 'bot' ? (
                        renderBotMessageText(message.text)
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      )}
                    </div>
                    {message.timestamp && (
                      <span className="text-xs text-gray-500 mt-1 px-2">
                        {formatTime(message.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl shrink-0">
            {/* 채팅창 열면 바로 표시: 어떤 도움 받을지 골라 본론 가능 (입력창 포커스 없이도) */}
            {selectedTopic === null && (
              <div className="mb-3 space-y-2 pt-1" onMouseDown={(e) => e.preventDefault()}>
                <p className="text-sm text-gray-700 font-medium">어떤 도움을 받고 싶으세요?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TOPICS.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key ?? 'x'}
                        type="button"
                        onClick={() => handlePickTopic(key)}
                        className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-primary-200 bg-primary-50/50 hover:border-primary-500 hover:bg-primary-100 text-primary-800 transition-colors text-sm font-medium"
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
            )}
            {selectedTopic && (
              <>
                <p className="text-xs text-primary-600 mb-2">
                  <span className="font-medium">{TOPICS.find((t) => t.key === selectedTopic)?.label}</span>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => setSelectedTopic(null)}
                    className="underline hover:no-underline"
                  >
                    다른 주제 선택
                  </button>
                </p>
                {suggestedQuestions.length > 0 && !hasSentMessageInCurrentTopic && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 font-medium mb-2">궁금하신 내용이 있을까요?</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((sq) => (
                        <button
                          key={sq.label}
                          type="button"
                          onClick={() => handleSuggestedQuestionClick(sq.label)}
                          disabled={isLoading}
                          className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-primary-300 text-gray-800 text-sm transition-colors disabled:opacity-50"
                        >
                          {sq.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={selectedTopic ? '궁금한 내용을 입력해 주세요' : '주제를 선택한 뒤 질문해 주세요'}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm placeholder-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="전송"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter로 전송, Shift+Enter로 줄바꿈
            </p>
          </div>
        </>
      )}
    </div>
  )
}
