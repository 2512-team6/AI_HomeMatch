import { useState } from 'react'
import { Info, Send, Paperclip } from 'lucide-react'

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: '안녕하세요! 홈매치 AI 어시스턴트입니다. 어떤 계약서 조항이나 법률 정보가 궁금하신가요? 질문해주시면 상세히 안내해 드릴게요.',
    },
    {
      id: 2,
      type: 'user',
      text: '전세 계약 시 꼭 확인해야 할 특약 사항이 무엇인가요?',
    },
    {
      id: 3,
      type: 'bot',
      text: '전세 계약 시 확인해야 할 주요 특약 사항은 다음과 같습니다:\n\n1. 대항력 및 우선변제권 확보\n2. 임대인의 등기부등본 현상 유지 의무\n3. 전세자금대출 관련 조항\n4. 원상복구 범위 명확화\n5. 묵시적 갱신 방지 또는 활용 조항\n\n더 자세히 알고 싶은 부분이 있으신가요?',
    },
    {
      id: 4,
      type: 'user',
      text: '현재 보고 있는 매물에 대해 어떤 점을 확인할 수 있을까요?',
    },
    {
      id: 5,
      type: 'bot',
      text: '현재 보고 계신 매물 상세 페이지에서는 "건물·매물 검증" 탭에서 위험 이력 타임라인을 확인하시고, "계약 전 체크리스트" 탭에서 현장 검증 가이드를 참고하실 수 있습니다.',
    },
  ])

  const [inputText, setInputText] = useState('')

  const quickTopics = [
    { title: '대항력과 우선변제권', desc: '세입자가 보증금을 보호받기 위한 핵심 권리' },
    { title: '계약 용어', desc: '' },
    { title: '확정일자의 중요성', desc: '전입신고 다음날부터 발생되는 보증금 보호 효력' },
    { title: '법률 가이드', desc: '' },
    { title: '전세 계약 해지 조건', desc: '계약 만료 전 중도 해지 시 고려 사항' },
    { title: '계약 해지', desc: '' },
    { title: '묵시적 갱신이란?', desc: '자동 연장되는 계약 기간 및 조건' },
    { title: '계약 갱신', desc: '' },
    { title: '임대차 3법 핵심', desc: '계약갱신청구권, 전월세' },
  ]

  const handleSend = () => {
    if (!inputText.trim()) return
    setMessages([...messages, { id: messages.length + 1, type: 'user', text: inputText }])
    setInputText('')
    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot',
          text: '죄송합니다. 더 자세한 답변을 위해 관련 정보를 확인 중입니다. 잠시만 기다려주세요.',
        },
      ])
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-1" />
          <p className="text-sm text-blue-800">
            챗봇의 조언은 법률 자문을 대체하지 않습니다. 특정 법률 문제에 대해서는 법률 전문가와 상담하십시오.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">관련 주제</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {quickTopics.map((topic, idx) => (
            <button
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="font-medium text-gray-900 mb-1">{topic.title}</div>
              {topic.desc && <div className="text-sm text-gray-600">{topic.desc}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


