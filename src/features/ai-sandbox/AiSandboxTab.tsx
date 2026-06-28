import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Sparkles,
  MessageSquare,
  BookOpen,
  Send,
  Award,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search
} from 'lucide-react'
import { useToeicStore, useActiveExam } from '../../store/useToeicStore'
import { TOEIC_GRAMMAR_FORMULAS } from '../../lib/toeic'
import {
  generateChatRoleplayResponse,
  evaluateChatRoleplay,
  evaluateStory,
  generateCustomStoryPrompt,
  generateCustomRoleplayScenario,
  type ChatRoleplayEvaluation,
  type StoryWriterFeedback,
} from '../../services/gemini.service'
import { CustomDialog } from '../../components/CustomDialog'

const ROLEPLAY_SCENARIOS = [
  {
    id: 'cafe-order',
    title: '☕ Đặt đồ ăn & Thảo luận tại quán Cafe',
    description: 'Đóng vai là đối tác kinh doanh gặp gỡ trao đổi về kế hoạch dự án sắp tới.',
    partnerRole: 'Alex (Business Partner)',
    scenarioPrompt: 'Meeting at a coffee shop to discuss the project launch timeline and budgets.',
    firstMessage: 'Hi there! Thanks for meeting me today. Shall we order some coffee first before we dive into the project timeline?'
  },
  {
    id: 'job-interview',
    title: '👔 Phỏng vấn tuyển dụng TOEIC',
    description: 'Đối thoại với nhà tuyển dụng hỏi về năng lực và kinh nghiệm làm việc.',
    partnerRole: 'Ms. Carter (HR Director)',
    scenarioPrompt: 'A formal job interview for a Senior Operations Manager position.',
    firstMessage: 'Good morning. Welcome to our corporate office. To start, could you please introduce yourself and explain why you are interested in this position?'
  },
  {
    id: 'negotiation',
    title: '🤝 Đàm phán Hợp đồng nhà cung cấp',
    description: 'Thương lượng các điều khoản giao hàng và chiết khấu đơn hàng.',
    partnerRole: 'Mr. Tanaka (Supplier Rep)',
    scenarioPrompt: 'Negotiating shipment discounts and delivery terms for a bulk order of electronics.',
    firstMessage: 'Hello. Thank you for expressing interest in our products. We can offer a 5% discount for orders exceeding 1,000 units. How does that sound to you?'
  },
  {
    id: 'airport-pickup',
    title: '✈️ Tiếp đón đối tác tại Sân bay',
    description: 'Tiếp đón khách hàng VIP nước ngoài đến thăm văn phòng công ty.',
    partnerRole: 'Sarah (VIP Client)',
    scenarioPrompt: 'Picking up a VIP client at the international arrival terminal and coordinating hotel transport.',
    firstMessage: 'Hi! Excuse me, are you the representative from TOEIC Global? It is so nice to finally meet you in person after all those emails!'
  },
  {
    id: 'customer-service',
    title: '📞 Khiếu nại sản phẩm qua điện thoại',
    description: 'Giải quyết tình huống khách hàng phản nàn về gói hàng bị hỏng và giao trễ.',
    partnerRole: 'David (Angry Customer)',
    scenarioPrompt: 'Handling an angry customer phone call regarding a delayed and damaged package shipment, negotiating a refund/exchange.',
    firstMessage: 'Hello! I am calling because the package I ordered last week finally arrived, but the item inside is cracked and completely unusable! I want a full refund immediately!'
  },
  {
    id: 'business-pitch',
    title: '💡 Thuyết trình gọi vốn Đầu tư',
    description: 'Trình bày ý tưởng kinh doanh mới và trả lời câu hỏi phản biện của quỹ đầu tư.',
    partnerRole: 'Clara (Venture Capitalist)',
    scenarioPrompt: 'Presenting a software startup business pitch and defending market research and competitive advantages.',
    firstMessage: 'Hi. Thanks for your pitch. The market seems saturated with similar task management tools. What makes your software unique compared to established competitors?'
  },
  {
    id: 'office-conflict',
    title: '🧩 Giải quyết bất đồng ý kiến nội bộ',
    description: 'Thảo luận thẳng thắn với trưởng nhóm dự án về khối lượng công việc và trễ hạn deadline.',
    partnerRole: 'Marcus (Project Lead)',
    scenarioPrompt: 'Resolving a dispute with a team leader regarding uneven task distribution and missed team milestones.',
    firstMessage: 'Hey. We need to talk about the marketing report. It was due yesterday, and since you didn\'t finish your section on time, the whole team is now delayed. What happened?'
  },
  {
    id: 'hotel-booking',
    title: '🏨 Đặt phòng & Yêu cầu dịch vụ khách sạn',
    description: 'Thực hiện thủ tục check-in phòng và thương lượng nâng cấp phòng thương gia.',
    partnerRole: 'Sophia (Hotel Receptionist)',
    scenarioPrompt: 'Checking in at a luxury business hotel, requesting a room upgrade, and coordinating laundry service timing.',
    firstMessage: 'Good evening, sir. Welcome to the Royal Plaza Hotel. I have your reservation for a standard double room for three nights. May I have your passport and credit card, please?'
  },
  {
    id: 'casual-weekend-plans',
    title: '☕ Kế hoạch Cuối tuần (Weekend Plans)',
    description: 'Trò chuyện tự nhiên với một đồng nghiệp thân thiết về các hoạt động giải trí dự kiến.',
    partnerRole: 'Lily (Close Colleague)',
    scenarioPrompt: 'A casual, friendly chat with a teammate during lunch break about what you both plan to do this weekend.',
    firstMessage: 'Hey! Friday is finally here. Do you have any exciting plans lined up for the weekend?'
  },
  {
    id: 'asking-directions',
    title: '🗺️ Hỏi đường & Tìm kiếm Địa điểm',
    description: 'Hỏi thăm người dân địa phương khi bạn bị lạc tại trung tâm thành phố New York.',
    partnerRole: 'James (Local Citizen)',
    scenarioPrompt: 'You are lost near Central Park and need to find the nearest subway station and a bagel shop.',
    firstMessage: 'Excuse me, you look a bit lost. Can I help you find your way somewhere?'
  },
  {
    id: 'restaurant-ordering',
    title: '🍽️ Gọi món & Trải nghiệm Nhà hàng',
    description: 'Thực hiện gọi món, yêu cầu đặc biệt và thanh toán hóa đơn với nhân viên phục vụ.',
    partnerRole: 'Oliver (Restaurant Waiter)',
    scenarioPrompt: 'Ordering a three-course dinner, asking about daily specials, requesting a gluten-free option, and splitting the bill.',
    firstMessage: 'Good evening! Welcome to The Bistro. Table for one? Here is the menu. I can take your drink order whenever you are ready.'
  },
  {
    id: 'neighbor-chat',
    title: '🏡 Trò chuyện Giao lưu với Hàng xóm',
    description: 'Gặp gỡ, chào hỏi hàng xóm mới chuyển đến và chia sẻ thông tin về khu phố.',
    partnerRole: 'Mrs. Gable (Next-door Neighbor)',
    scenarioPrompt: 'Welcoming a new neighbor who just moved in next door, giving advice about trash collection days and local stores.',
    firstMessage: 'Hello! I saw the moving truck outside earlier. I\'m Mrs. Gable from next door. Welcome to the neighborhood!'
  }
]

const STORY_PROMPTS = [
  {
    id: 'business-trip',
    title: '✈️ Đi công tác',
    fullPrompt: 'Kể về một chuyến đi công tác nước ngoài đáng nhớ của bạn (A business trip abroad).'
  },
  {
    id: 'client-complaint',
    title: '😤 Phàn nàn khách',
    fullPrompt: 'Mô tả một tình huống xử lý phàn nàn của khách hàng khó tính (Handling a client complaint).'
  },
  {
    id: 'project-meeting',
    title: '🚨 Họp khẩn cấp',
    fullPrompt: 'Kể về một cuộc họp dự án khẩn cấp với nhiều ý kiến tranh luận (An urgent project meeting).'
  },
  {
    id: 'anniversary',
    title: '🎉 Kỷ niệm công ty',
    fullPrompt: 'Mô tả một buổi lễ kỷ niệm ngày thành lập công ty (A company anniversary celebration).'
  },
  {
    id: 'office-relocation',
    title: '📦 Dời văn phòng',
    fullPrompt: 'Mô tả quá trình chuẩn bị và những khó khăn khi chuyển văn phòng công ty sang một địa điểm mới (Moving to a new office location).'
  },
  {
    id: 'performance-review',
    title: '📈 Đánh giá năng lực',
    fullPrompt: 'Kể về một buổi đánh giá hiệu suất công việc định kỳ cuối năm với quản lý trực tiếp của bạn (Annual performance review session).'
  },
  {
    id: 'product-launch',
    title: '🚀 Ra mắt sản phẩm',
    fullPrompt: 'Mô tả không khí chuẩn bị và chiến dịch tiếp thị cho buổi lễ ra mắt dòng sản phẩm mới của công ty (New product launch event and marketing campaign).'
  },
  {
    id: 'team-building',
    title: '🏕️ Dã ngoại tập thể',
    fullPrompt: 'Kể về một chuyến dã ngoại tập thể (Team building trip) của công ty nhằm gắn kết tình đồng đội (Company team-building outing).'
  },
  {
    id: 'sudden-rain',
    title: '🌧️ Cơn mưa bất chợt',
    fullPrompt: 'Kể về một kỷ niệm đáng nhớ khi bạn và những người đồng nghiệp gặp một cơn mưa lớn bất chợt trên đường đi làm... (A sudden heavy downpour on the way to work).'
  },
  {
    id: 'island-journey',
    title: '🏝️ Hành trình đảo hoang',
    fullPrompt: 'Tưởng tượng và viết về một chuyến du lịch thám hiểm đến một hòn đảo nhiệt đới hoang sơ... (An adventure trip to a remote tropical island).'
  },
  {
    id: 'childhood-memory',
    title: '🧸 Ký ức tuổi thơ',
    fullPrompt: 'Chia sẻ về một món đồ chơi hoặc một kỷ niệm êm đềm thời thơ ấu mà bạn vẫn luôn trân trọng... (A cherished childhood memory or toy).'
  },
  {
    id: 'no-phone-day',
    title: '📵 Một ngày không điện thoại',
    fullPrompt: 'Mô tả những trải nghiệm thú vị và cả khó khăn khi bạn quyết định không sử dụng điện thoại trong vòng 24 giờ... (Living without a smartphone for 24 hours).'
  },
  {
    id: 'vast-universe',
    title: '🌌 Vũ trụ bao la',
    fullPrompt: 'Viết một câu chuyện khoa học viễn tưởng ngắn về chuyến bay thám hiểm sao Hỏa của phi hành đoàn đầu tiên... (A short sci-fi story about the first manned mission to Mars).'
  }
]


interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface WindowWithSpeech {
  SpeechRecognition?: new () => SpeechRecognitionInstance
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance
}

export function AiSandboxTab() {
  const geminiApiKey = useToeicStore((state) => state.geminiApiKey)
  const flashcards = useToeicStore((state) => state.flashcards)
  const activeExam = useActiveExam()
  const [subTab, setSubTab] = useState<'chat' | 'story'>('chat')

  // --- Chat Roleplay States ---
  const [selectedScenario, setSelectedScenario] = useState<typeof ROLEPLAY_SCENARIOS[0] | null>(null)
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isEvaluatingChat, setIsEvaluatingChat] = useState(false)
  const [chatEvaluation, setChatEvaluation] = useState<ChatRoleplayEvaluation | null>(null)
  const [isChatFeedbackOpenMobile, setIsChatFeedbackOpenMobile] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // --- Voice Input & TTS States ---
  const [isListeningVoice, setIsListeningVoice] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Web Speech API - Speech Recognition Setup
  useEffect(() => {
    const win = window as unknown as WindowWithSpeech
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => {
        setIsListeningVoice(true)
      }

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setChatInput((prev) => (prev ? prev + ' ' + transcript : transcript))
        }
      }

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListeningVoice(false)
      }

      rec.onend = () => {
        setIsListeningVoice(false)
      }

      recognitionRef.current = rec
    }
  }, [])

  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showAlert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Speech Recognition). Hãy thử dùng Chrome hoặc Safari.', 'Không hỗ trợ', 'warning')
      return
    }
    if (isListeningVoice) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const speakText = useCallback((text: string) => {
    if (!autoSpeak) return
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      const voices = window.speechSynthesis.getVoices()
      const engVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                       voices.find(v => v.lang.startsWith('en'))
      if (engVoice) {
        utterance.voice = engVoice
      }
      window.speechSynthesis.speak(utterance)
    }
  }, [autoSpeak])

  // Extract memory context (weak vocabulary words and flagged grammar formula traps)
  const pastMistakes = useMemo(() => {
    const vocab = flashcards.filter(c => c.box <= 2).map(c => `Word: "${c.word}"`)
    const grammar = activeExam.notes.selectedGrammarFormulaIds
      .map(id => {
        const found = TOEIC_GRAMMAR_FORMULAS.find(f => f.id === id)
        return found ? `Grammar: "${found.title} (${found.formula})"` : null
      })
      .filter((v): v is string => !!v)
    return [...vocab, ...grammar]
  }, [flashcards, activeExam])



  // --- Story Writer States ---
  const [storyTopic, setStoryTopic] = useState(STORY_PROMPTS[0].fullPrompt)
  const [storyText, setStoryText] = useState('')
  const [isEvaluatingStory, setIsEvaluatingStory] = useState(false)
  const [storyFeedback, setStoryFeedback] = useState<StoryWriterFeedback | null>(null)
  const [storyPhase, setStoryPhase] = useState<'writing' | 'feedback'>('writing')
  const [copiedStory, setCopiedStory] = useState(false)

  // --- Custom AI Generation States ---
  const [customScenarios, setCustomScenarios] = useState<typeof ROLEPLAY_SCENARIOS>([])
  const [customRoleplayInput, setCustomRoleplayInput] = useState('')
  const [isGeneratingCustomScenario, setIsGeneratingCustomScenario] = useState(false)

  const [customStoryPrompts, setCustomStoryPrompts] = useState<typeof STORY_PROMPTS>([])
  const [customStoryInput, setCustomStoryInput] = useState('')
  const [isGeneratingCustomStory, setIsGeneratingCustomStory] = useState(false)

  const [roleplaySearchQuery, setRoleplaySearchQuery] = useState('')
  const [storySearchQuery, setStorySearchQuery] = useState('')

  const allScenarios = useMemo(() => {
    return [...customScenarios, ...ROLEPLAY_SCENARIOS]
  }, [customScenarios])

  const filteredScenarios = useMemo(() => {
    const query = roleplaySearchQuery.toLowerCase().trim()
    if (!query) return allScenarios
    return allScenarios.filter(sc => 
      sc.title.toLowerCase().includes(query) || 
      sc.description.toLowerCase().includes(query) ||
      sc.partnerRole.toLowerCase().includes(query)
    )
  }, [allScenarios, roleplaySearchQuery])

  const allStoryPrompts = useMemo(() => {
    return [...customStoryPrompts, ...STORY_PROMPTS]
  }, [customStoryPrompts])

  const filteredStoryPrompts = useMemo(() => {
    const query = storySearchQuery.toLowerCase().trim()
    if (!query) return allStoryPrompts
    return allStoryPrompts.filter(prompt => 
      prompt.title.toLowerCase().includes(query) || 
      prompt.fullPrompt.toLowerCase().includes(query)
    )
  }, [allStoryPrompts, storySearchQuery])


  // --- Custom Dialog State ---
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean
    title?: string
    message: string
    variant?: 'info' | 'warning' | 'danger'
  } | null>(null)

  const showAlert = useCallback((message: string, title: string = 'Thông báo', variant: 'info' | 'warning' | 'danger' = 'info') => {
    const typeMap = {
      info: 'info' as const,
      warning: 'warning' as const,
      danger: 'error' as const,
    }
    useToeicStore.getState().showToast(message, typeMap[variant], title)
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // --- Roleplay Handlers ---
  const handleStartScenario = (scenario: typeof ROLEPLAY_SCENARIOS[0]) => {
    setSelectedScenario(scenario)
    setChatHistory([{ role: 'model', text: scenario.firstMessage }])
    setChatEvaluation(null)
    setIsChatFeedbackOpenMobile(false)
    setChatInput('')
  }

  const handleResetChat = () => {
    setSelectedScenario(null)
    setChatHistory([])
    setChatEvaluation(null)
    setIsChatFeedbackOpenMobile(false)
  }

  const handleSendChatMessage = async () => {
    const text = chatInput.trim()
    if (!text || !selectedScenario) return

    if (!geminiApiKey) {
      showAlert('Vui lòng thêm API Key Google Gemini trong tab Cài đặt cấu hình để bắt đầu trò chuyện.', 'Thiếu API Key', 'warning')
      return
    }

    // Add user message to history
    const nextHistory = [...chatHistory, { role: 'user' as const, text }]
    setChatHistory(nextHistory)
    setChatInput('')
    setIsChatLoading(true)

    try {
      const response = await generateChatRoleplayResponse(
        geminiApiKey,
        selectedScenario.scenarioPrompt,
        selectedScenario.partnerRole,
        nextHistory,
        text,
        pastMistakes
      )
      setChatHistory((curr) => [...curr, { role: 'model', text: response }])
      speakText(response)
    } catch (err) {
      console.error(err)
      setChatHistory((curr) => [...curr, { role: 'model', text: 'Sorry, I had trouble generating a reply. Please try again.' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleEvaluateChat = async () => {
    if (!selectedScenario || chatHistory.length < 2) return

    if (!geminiApiKey) {
      showAlert('Cần cấu hình API Key Google Gemini trong tab Cài đặt.', 'Thiếu API Key', 'warning')
      return
    }

    setIsEvaluatingChat(true)
    setChatEvaluation(null)
    setIsChatFeedbackOpenMobile(false)

    try {
      const evalData = await evaluateChatRoleplay(
        geminiApiKey,
        selectedScenario.scenarioPrompt,
        selectedScenario.partnerRole,
        chatHistory
      )
      setChatEvaluation(evalData)
      setIsChatFeedbackOpenMobile(true)
    } catch (err) {
      console.error(err)
      showAlert('Đã xảy ra lỗi khi chấm điểm hội thoại.', 'Lỗi hệ thống', 'danger')
    } finally {
      setIsEvaluatingChat(false)
    }
  }

  // --- Story Writer Handlers ---
  const handleEvaluateStory = async () => {
    const text = storyText.trim()
    if (!text) return

    if (!geminiApiKey) {
      showAlert('Vui lòng thêm API Key Google Gemini trong tab Cài đặt cấu hình.', 'Thiếu API Key', 'warning')
      return
    }

    setIsEvaluatingStory(true)
    setStoryFeedback(null)

    try {
      const feedback = await evaluateStory(geminiApiKey, storyTopic, text)
      setStoryFeedback(feedback)
      setStoryPhase('feedback')
    } catch (err) {
      console.error(err)
      showAlert('Đã xảy ra lỗi khi phân tích bài viết.', 'Lỗi hệ thống', 'danger')
    } finally {
      setIsEvaluatingStory(false)
    }
  }

  const handleCopyStory = () => {
    if (!storyFeedback) return
    navigator.clipboard.writeText(storyFeedback.rewrittenStory)
    setCopiedStory(true)
    setTimeout(() => setCopiedStory(false), 2000)
  }

  const handleResetStory = () => {
    setStoryText('')
    setStoryFeedback(null)
    setStoryPhase('writing')
  }

  const handleGenerateCustomScenario = async (ideaText?: string) => {
    const idea = ideaText || customRoleplayInput.trim()
    if (!idea) return
    if (!geminiApiKey) {
      showAlert('Vui lòng cấu hình API Key Google Gemini trong tab Cài đặt.', 'Thiếu API Key', 'warning')
      return
    }
    setIsGeneratingCustomScenario(true)
    try {
      const newSc = await generateCustomRoleplayScenario(geminiApiKey, idea)
      setCustomScenarios(prev => [newSc, ...prev])
      handleStartScenario(newSc)
      setCustomRoleplayInput('')
      useToeicStore.getState().showToast(`Đã tạo thành công tình huống: "${newSc.title}"`, 'success', 'Tạo tình huống qua AI')
    } catch (err) {
      console.error(err)
      showAlert('Không thể tạo tình huống qua AI. Vui lòng kiểm tra API Key.', 'Lỗi tạo tình huống', 'danger')
    } finally {
      setIsGeneratingCustomScenario(false)
    }
  }

  const handleGenerateCustomStory = async (ideaText?: string) => {
    const idea = ideaText || customStoryInput.trim()
    if (!idea) return
    if (!geminiApiKey) {
      showAlert('Vui lòng cấu hình API Key Google Gemini trong tab Cài đặt.', 'Thiếu API Key', 'warning')
      return
    }
    setIsGeneratingCustomStory(true)
    try {
      const newPrompt = await generateCustomStoryPrompt(geminiApiKey, idea)
      setCustomStoryPrompts(prev => [newPrompt, ...prev])
      setStoryTopic(newPrompt.fullPrompt)
      setCustomStoryInput('')
      useToeicStore.getState().showToast(`Đã tạo thành công chủ đề viết: "${newPrompt.title}"`, 'success', 'Tạo chủ đề viết qua AI')
    } catch (err) {
      console.error(err)
      showAlert('Không thể tạo chủ đề qua AI. Vui lòng kiểm tra API Key.', 'Lỗi tạo chủ đề', 'danger')
    } finally {
      setIsGeneratingCustomStory(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent select-none animate-in fade-in duration-200">
      {/* Tab Switcher */}
      <div className="border-b border-slate-200 dark:border-zinc-800 px-4 py-2.5 sm:px-6 shrink-0 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 justify-center sm:justify-start">
          <Sparkles className="size-4 text-violet-500 dark:text-cyan-400 animate-pulse animate-duration-1000" />
          <h2 className="text-sm font-black text-slate-800 dark:text-white whitespace-nowrap">Trợ lý AI Sandbox</h2>
        </div>
        <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/20 dark:border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => setSubTab('chat')}
            className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition whitespace-nowrap ${
              subTab === 'chat'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            Trò chuyện giao tiếp
          </button>
          <button
            onClick={() => setSubTab('story')}
            className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition whitespace-nowrap ${
              subTab === 'story'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            Viết truyện sáng tạo
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        {/* --- 1. SUBTAB: AI CHAT ROLEPLAY --- */}
        {subTab === 'chat' && (
          <div className="w-full max-w-3xl mx-auto h-full flex flex-col min-h-0">
            {!selectedScenario ? (
              // Scenario Selector Grid
              <div className="space-y-6 text-left animate-in slide-in-from-bottom-4 duration-300">
                <div className="hidden lg:block text-center space-y-2 select-none">
                  <div className="mx-auto size-12 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <MessageSquare className="size-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Hội thoại Giao tiếp Thực tế</h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed text-center">
                    Chọn một tình huống thực tế để đối thoại trực tiếp với Trợ lý AI đóng vai đối tác/nhà tuyển dụng bản xứ. Nhận chấm điểm và sửa lỗi chi tiết sau khi kết thúc.
                  </p>
                </div>

                {/* Search scenario bar */}
                <div className="flex flex-col gap-3">
                  <div className="relative select-none">
                    <input
                      type="text"
                      placeholder="Tìm kiếm chủ đề giao tiếp (ví dụ: phỏng vấn, khách sạn, cafe, hỏi đường...)"
                      value={roleplaySearchQuery}
                      onChange={(e) => setRoleplaySearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 sleek-input placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                    <Search className="absolute left-3.5 top-3.5 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>

                  {roleplaySearchQuery.trim() && (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left animate-in fade-in duration-200 select-none">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          Bạn muốn thiết lập tình huống riêng theo ý bạn?
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                          AI sẽ tự thiết kế tình huống & tin nhắn mở đầu dựa trên từ khóa: &ldquo;{roleplaySearchQuery}&rdquo;
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateCustomScenario(roleplaySearchQuery)}
                        disabled={isGeneratingCustomScenario}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <Sparkles className="size-3 animate-pulse" />
                        {isGeneratingCustomScenario ? 'Đang tạo...' : 'Tạo bằng AI'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom AI Scenario Generator Panel */}
                {!roleplaySearchQuery.trim() && (
                  <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-zinc-800/80 shadow-md space-y-3.5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-violet-600 dark:text-cyan-400 tracking-wider block">
                        ✨ Tự thiết kế tình huống bằng AI
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                        Nhập bất kỳ ý tưởng hoặc tình huống nào bạn muốn thực hành (ví dụ: Khám bệnh ở London, Mua hàng tại siêu thị, Thương lượng tăng lương...).
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập ý tưởng tình huống giao tiếp của bạn..."
                        value={customRoleplayInput}
                        onChange={(e) => setCustomRoleplayInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomScenario()}
                        disabled={isGeneratingCustomScenario}
                        className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-55 dark:bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-violet-500/25 sleek-input placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleGenerateCustomScenario()}
                        disabled={!customRoleplayInput.trim() || isGeneratingCustomScenario}
                        className="px-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-sm whitespace-nowrap"
                      >
                        {isGeneratingCustomScenario ? 'Đang tạo...' : 'Tạo bằng AI'}
                      </button>
                    </div>

                    {/* Quick suggestions pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5 items-center select-none">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase mr-1">Gợi ý nhanh:</span>
                      {[
                        { icon: '🏥', text: 'Khám sức khỏe' },
                        { icon: '👔', text: 'Phỏng vấn IT' },
                        { icon: '🚕', text: 'Đặt taxi sân bay' },
                        { icon: '🍕', text: 'Đặt giao pizza' }
                      ].map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleGenerateCustomScenario(`${sug.icon} ${sug.text}`)}
                          disabled={isGeneratingCustomScenario}
                          className="px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer whitespace-nowrap"
                        >
                          {sug.icon} {sug.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredScenarios.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-center space-y-4 select-none">
                    <span className="text-3xl">🔍</span>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200">Không tìm thấy tình huống giao tiếp phù hợp.</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-405">Bạn muốn nhờ AI thiết kế nhanh một tình huống theo từ khóa &ldquo;{roleplaySearchQuery}&rdquo; không?</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateCustomScenario(roleplaySearchQuery)}
                      disabled={isGeneratingCustomScenario}
                      className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="size-4 animate-pulse" />
                      {isGeneratingCustomScenario ? 'Đang tạo qua AI...' : `Tạo tình huống "${roleplaySearchQuery}"`}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredScenarios.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => handleStartScenario(sc)}
                        className="text-left rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 p-5 hover:border-violet-500/50 dark:hover:border-violet-500/30 hover:scale-[1.01] transition-all duration-200 group shadow-sm flex flex-col justify-between cursor-pointer"
                      >
                        <div className="space-y-2">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition">
                            {sc.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                            {sc.description}
                          </p>
                        </div>
                        <div className="pt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800 mt-4 w-full">
                          <span>Đóng vai: {sc.partnerRole}</span>
                          <ChevronRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Chat conversation pane
              <div className="w-full flex-1 flex flex-col h-[520px] md:h-[580px] lg:h-[650px] lg:min-h-0 glass-panel rounded-3xl overflow-hidden border border-slate-200/50 dark:border-zinc-800/60 shadow-xl">
                {/* Scenario Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 flex items-center justify-between shrink-0 select-none">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-violet-600 dark:text-cyan-400 tracking-widest block">AI Roleplay Chat</span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                      {selectedScenario.partnerRole}
                    </h3>
                  </div>
                  <button
                    onClick={handleResetChat}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer"
                  >
                    Đổi tình huống
                  </button>
                </div>

                {/* Chat Message Logs */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/20 dark:bg-transparent min-h-0 select-text">
                  {chatHistory.map((msg, idx) => {
                    const isModel = msg.role === 'model'
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 max-w-[85%] animate-in slide-in-from-bottom-2 duration-150 ${
                          isModel ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                        }`}
                      >
                        <div className={`size-8 rounded-xl flex items-center justify-center text-xs font-black select-none shrink-0 ${
                          isModel
                            ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20'
                            : 'bg-indigo-600 text-white shadow-sm'
                        }`}>
                          {isModel ? selectedScenario.partnerRole[0] : 'Me'}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block select-none">
                            {isModel ? selectedScenario.partnerRole : 'Tôi'}
                          </span>
                          <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-semibold ${
                            isModel
                              ? 'bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
                              : 'bg-indigo-600 text-white'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {isChatLoading && (
                    <div className="flex gap-3 mr-auto items-center">
                      <div className="size-8 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center justify-center text-xs font-black animate-pulse select-none">
                        {selectedScenario.partnerRole[0]}
                      </div>
                      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-slate-500 animate-bounce" />
                        <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]" />
                        <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Desktop-only Evaluation Results Banner */}
                {chatEvaluation && (
                  <div className="hidden lg:block p-5 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 space-y-4 max-h-[300px] overflow-y-auto text-left select-text animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Award className="size-6 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase select-none">Điểm đánh giá hội thoại</span>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white leading-none">
                          {chatEvaluation.overallScore}/100
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block select-none">Nhận xét tổng quát</span>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-semibold">
                        {chatEvaluation.generalFeedback}
                      </p>
                    </div>

                    {chatEvaluation.corrections.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-900/50">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block select-none">Sửa lỗi & gợi ý chi tiết</span>
                        <div className="space-y-2.5">
                          {chatEvaluation.corrections.map((corr, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-200/50 dark:border-zinc-900 bg-slate-50/20 dark:bg-zinc-900/10 p-3 space-y-1.5">
                              <p className="text-xs line-through text-rose-600 dark:text-rose-500 font-semibold">
                                &ldquo;{corr.userMessage}&rdquo;
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                                → &ldquo;{corr.correction}&rdquo;
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed pl-2.5 border-l border-slate-300 dark:border-zinc-700">
                                {corr.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Input Text Box Bar */}
                <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/40 shrink-0 select-none">
                  {chatEvaluation ? (
                    <div className="flex gap-2.5">
                      <button
                        onClick={handleResetChat}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 text-xs font-black uppercase tracking-wider transition hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <RotateCcw className="size-4" />
                        Chơi lại tình huống mới
                      </button>
                      <button
                        onClick={() => setIsChatFeedbackOpenMobile(true)}
                        className="block lg:hidden px-4 py-3.5 border border-indigo-200 dark:border-violet-500/35 bg-indigo-50/50 dark:bg-violet-500/10 text-indigo-600 dark:text-violet-400 rounded-2xl text-xs font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        Xem lại điểm
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        title={autoSpeak ? "Tắt tự động phát âm" : "Bật tự động phát âm"}
                        className={`p-3 rounded-xl transition hover:scale-[1.05] active:scale-[0.95] cursor-pointer flex items-center justify-center shrink-0 border ${
                          autoSpeak 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-500/30' 
                            : 'bg-slate-50/60 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        {autoSpeak ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                      </button>

                      <button
                        onClick={handleToggleVoiceInput}
                        disabled={isChatLoading || isEvaluatingChat}
                        title={isListeningVoice ? "Đang nghe... Nhấp để dừng" : "Luyện nói bằng giọng nói"}
                        className={`p-3 rounded-xl transition hover:scale-[1.05] active:scale-[0.95] cursor-pointer flex items-center justify-center shrink-0 border ${
                          isListeningVoice 
                            ? 'bg-rose-500 border-rose-600 text-white animate-pulse' 
                            : 'bg-slate-50/60 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        {isListeningVoice ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                      </button>

                      <input
                        type="text"
                        placeholder={isListeningVoice ? "Đang lắng nghe giọng nói tiếng Anh..." : "Type your response in English..."}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        disabled={isChatLoading || isEvaluatingChat}
                        className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-violet-500/25 sleek-input placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        disabled={!chatInput.trim() || isChatLoading || isEvaluatingChat}
                        className="p-3 bg-indigo-600 text-white rounded-xl transition hover:scale-[1.05] active:scale-[0.95] cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center shrink-0"
                      >
                        <Send className="size-4" />
                      </button>
                      {chatHistory.length >= 3 && (
                        <button
                          onClick={handleEvaluateChat}
                          disabled={isEvaluatingChat}
                          className="px-3 py-2 border border-indigo-200 dark:border-violet-500/35 bg-indigo-50/50 dark:bg-violet-500/10 text-indigo-600 dark:text-violet-400 rounded-xl text-xs font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {isEvaluatingChat ? 'Đang phân tích...' : 'Kết thúc'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 2. SUBTAB: AI STORY WRITER --- */}
        {subTab === 'story' && (
          <div className="w-full max-w-3xl mx-auto space-y-6 text-left animate-in slide-in-from-bottom-4 duration-300 select-none animate-in fade-in">
            <div className="hidden lg:block text-center space-y-2 select-none">
              <div className="mx-auto size-12 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <BookOpen className="size-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Viết Truyện & Phân Tích Ngữ Pháp</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-405 max-w-md mx-auto leading-relaxed text-center">
                Viết một câu chuyện ngắn bằng tiếng Anh theo các gợi ý công việc dưới đây. Trợ lý AI sẽ chấm điểm, phát hiện lỗi sai chi tiết và viết lại truyện ở trình độ người bản xứ.
              </p>
            </div>

            {isEvaluatingStory ? (
              // Loading Screen
              <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center">
                <div className="relative">
                  <div className="size-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-spin">
                    <Sparkles className="size-7 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">AI Writing Partner</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                    Đang quét bài viết, kiểm tra cấu trúc cú pháp và tiến hành viết lại văn bản native...
                  </p>
                </div>
              </div>
            ) : storyPhase === 'writing' ? (
              // Phase 1: Editor Form
              <div className="glass-panel rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/60 space-y-4 shadow-sm select-text">
                {/* Search story prompts bar */}
                <div className="flex flex-col gap-3">
                  <div className="relative select-none">
                    <input
                      type="text"
                      placeholder="Tìm kiếm chủ đề viết (ví dụ: công tác, họp, dời văn phòng, vũ trụ...)"
                      value={storySearchQuery}
                      onChange={(e) => setStorySearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-violet-500/10 sleek-input placeholder:text-slate-400 dark:placeholder:text-zinc-550"
                    />
                    <Search className="absolute left-3.5 top-3.5 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>

                  {storySearchQuery.trim() && (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-55/20 dark:bg-zinc-950/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left animate-in fade-in duration-200 select-none">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          Bạn muốn thiết kế chủ đề viết riêng?
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                          AI sẽ tự thiết kế chủ đề viết chi tiết song ngữ dựa trên từ khóa: &ldquo;{storySearchQuery}&rdquo;
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateCustomStory(storySearchQuery)}
                        disabled={isGeneratingCustomStory}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <Sparkles className="size-3 animate-pulse" />
                        {isGeneratingCustomStory ? 'Đang tạo...' : 'Tạo bằng AI'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 select-none">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550 block">Chọn chủ đề gợi ý</span>
                  
                  {filteredStoryPrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-center space-y-3 select-none my-2">
                      <span className="text-2xl">🔍</span>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Không tìm thấy chủ đề gợi ý phù hợp.</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">Nhờ AI tạo nhanh chủ đề dựa trên từ khóa &ldquo;{storySearchQuery}&rdquo;.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateCustomStory(storySearchQuery)}
                        disabled={isGeneratingCustomStory}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Sparkles className="size-3 animate-pulse" />
                        Tạo chủ đề qua AI
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Desktop view topic buttons */}
                      <div className="hidden sm:flex flex-wrap gap-2 pt-1">
                        {filteredStoryPrompts.map((prompt) => (
                          <button
                            key={prompt.id}
                            type="button"
                            onClick={() => setStoryTopic(prompt.fullPrompt)}
                            className={`text-left text-xs font-bold px-3.5 py-2.5 rounded-xl border transition cursor-pointer ${
                              storyTopic === prompt.fullPrompt
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-655 dark:bg-violet-500/15 dark:border-violet-500/35 dark:text-violet-300'
                                : 'bg-white dark:bg-zinc-900 border-slate-200/40 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                            }`}
                          >
                            {prompt.title}
                          </button>
                        ))}
                      </div>

                      {/* Mobile view horizontal scrollable topics */}
                      <div className="block sm:hidden -mx-5 px-5 overflow-x-auto scrollbar-none py-1.5">
                        <div className="flex gap-2.5 w-max">
                          {filteredStoryPrompts.map((prompt) => (
                            <button
                              key={prompt.id}
                              type="button"
                              onClick={() => setStoryTopic(prompt.fullPrompt)}
                              className={`px-3 py-2 rounded-xl border text-[11px] font-extrabold transition duration-200 cursor-pointer whitespace-nowrap ${
                                storyTopic === prompt.fullPrompt
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-655 dark:bg-violet-500/15 dark:border-violet-500/35 dark:text-violet-300 choice-glow-active'
                                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400'
                              }`}
                            >
                              {prompt.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Custom AI Story Topic Generator */}
                  {!storySearchQuery.trim() && (
                    <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-900/50 space-y-2.5 select-none">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-violet-600 dark:text-cyan-400 tracking-wider block">
                          ✨ Tự thiết kế chủ đề viết bằng AI
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                          Nhập từ khóa hoặc ý tưởng (ví dụ: làm việc từ xa, sửa máy in, chuẩn bị thuyết trình...) để AI tự động xây dựng chủ đề viết truyện cho bạn.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập ý tưởng chủ đề viết truyện của bạn..."
                          value={customStoryInput}
                          onChange={(e) => setCustomStoryInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomStory()}
                          disabled={isGeneratingCustomStory}
                          className="flex-1 min-w-0 rounded-xl border border-slate-200/40 dark:border-zinc-800 bg-slate-55 dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-violet-500/25 sleek-input placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateCustomStory()}
                          disabled={!customStoryInput.trim() || isGeneratingCustomStory}
                          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-sm whitespace-nowrap font-black"
                        >
                          {isGeneratingCustomStory ? 'Đang tạo...' : 'Tạo bằng AI'}
                        </button>
                      </div>

                      {/* Quick suggestions pills */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase mr-1">Gợi ý nhanh:</span>
                        {[
                          { icon: '💻', text: 'Làm việc từ xa' },
                          { icon: '🖨️', text: 'Sửa thiết bị VP' },
                          { icon: '🛫', text: 'Đi công vụ' },
                          { icon: '📞', text: 'Phàn nàn giá cả' }
                        ].map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleGenerateCustomStory(`${sug.icon} ${sug.text}`)}
                            disabled={isGeneratingCustomStory}
                            className="px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 text-[9px] font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer whitespace-nowrap"
                          >
                            {sug.icon} {sug.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Topic Details Box */}
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider block select-none">
                    Chủ đề chi tiết
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-350 leading-relaxed">
                    {storyTopic}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="story-writer-textarea" className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block select-none">Viết câu chuyện của bạn (Tối thiểu 30 từ)</label>
                  <textarea
                    id="story-writer-textarea"
                    placeholder="Once upon a time, my company sent me to a business conference in Tokyo..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="w-full h-72 sm:h-96 md:h-[420px] resize-none rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-4 py-3.5 text-xs leading-6 text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-violet-500/25 sleek-input placeholder:text-slate-400 dark:placeholder:text-zinc-500 select-text font-medium"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 select-none">
                  <button
                    type="button"
                    onClick={handleResetStory}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer"
                  >
                    Xóa viết lại
                  </button>
                  <button
                    type="button"
                    onClick={handleEvaluateStory}
                    disabled={!storyText.trim()}
                    className="w-full sm:w-auto inline-flex h-10 items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white text-xs font-black tracking-wider uppercase px-5 rounded-xl transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-500/10 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                  >
                    <Sparkles className="size-3.5 fill-current" />
                    Nộp & AI sửa ngữ pháp
                  </button>
                </div>
              </div>
            ) : (
              // Phase 2: Feedback View
              <div className="space-y-4 animate-in fade-in duration-200">
                {storyFeedback && (
                  <div className="glass-panel rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/60 space-y-4 shadow-sm select-text">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-900/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                          <Award className="size-5.5 text-violet-600 dark:text-violet-400 animate-bounce" />
                        </div>
                        <div className="text-left space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase block select-none">Điểm đánh giá viết</span>
                          <h4 className="text-lg font-black text-slate-800 dark:text-white leading-none">
                            {storyFeedback.score}/100
                          </h4>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => setStoryPhase('writing')}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-extrabold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 transition cursor-pointer"
                        >
                          Sửa lại
                        </button>
                        <button
                          onClick={handleResetStory}
                          className="px-3 py-1.5 rounded-xl bg-violet-600 dark:bg-violet-500 text-white text-[10px] font-extrabold hover:bg-violet-700 transition cursor-pointer"
                        >
                          Viết truyện mới
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider block select-none">Nhận xét bài viết</span>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-semibold">
                        {storyFeedback.feedback}
                      </p>
                    </div>

                    {storyFeedback.errors.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-900/50">
                        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider block select-none">Phân tích lỗi sai chi tiết</span>
                        <div className="space-y-3">
                          {storyFeedback.errors.map((err, idx) => (
                            <div key={idx} className="rounded-2xl border border-slate-200/50 dark:border-zinc-900 bg-slate-50/20 dark:bg-zinc-900/10 p-4 space-y-2">
                              <p className="text-xs line-through text-rose-600 dark:text-rose-500 font-semibold">
                                &ldquo;{err.text}&rdquo;
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500 font-extrabold">
                                <ArrowRight className="size-3.5 shrink-0" />
                                <span>&ldquo;{err.correction}&rdquo;</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium pl-2.5 border-l border-slate-300 dark:border-zinc-700 space-y-1">
                                <span className="font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] block">Lỗi: {err.error}</span>
                                <span>{err.explanation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-900/50">
                      <div className="flex items-center justify-between gap-4 select-none">
                        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider block">Phiên bản viết lại của AI (Native-level)</span>
                        <button
                          onClick={handleCopyStory}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-extrabold text-slate-500 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer"
                        >
                          {copiedStory ? (
                            <>
                              <Check className="size-3.5 text-emerald-500" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              <span>Sao chép bản sửa</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 text-xs font-semibold leading-relaxed whitespace-pre-wrap select-text border border-zinc-800">
                        {storyFeedback.rewrittenStory}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile BottomSheet for Chat Evaluation */}
      {chatEvaluation && isChatFeedbackOpenMobile && (
        <div className="block lg:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsChatFeedbackOpenMobile(false)}
          />
          
          {/* Drawer Container */}
          <div className="relative w-full max-h-[85vh] bg-white dark:bg-[#0a0a14] rounded-t-[32px] border-t border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col min-h-0 animate-in slide-in-from-bottom duration-300 select-text">
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto my-3 shrink-0" />
            
            {/* Title Bar */}
            <div className="px-6 py-2 border-b border-slate-100 dark:border-zinc-900/60 flex items-center justify-between shrink-0 select-none">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kết quả đánh giá hội thoại</h4>
              <button
                onClick={() => setIsChatFeedbackOpenMobile(false)}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[10px] font-black text-slate-600 dark:text-zinc-300 cursor-pointer hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            {/* Score & General Feedback Scroll Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-zinc-900/60 pb-4">
                <div className="size-14 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Award className="size-8 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold block uppercase select-none">Tổng điểm giao tiếp</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                    {chatEvaluation.overallScore}/100
                  </h4>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block select-none">Nhận xét từ giáo viên AI</span>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-semibold">
                  {chatEvaluation.generalFeedback}
                </p>
              </div>

              {chatEvaluation.corrections.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-900/60 text-left">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block select-none">Sửa chi tiết từng câu thoại</span>
                  <div className="space-y-3">
                    {chatEvaluation.corrections.map((corr, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-200/50 dark:border-zinc-900 bg-slate-50/20 dark:bg-zinc-900/10 p-4 space-y-2">
                        <p className="text-xs line-through text-rose-600 dark:text-rose-500 font-semibold">
                          &ldquo;{corr.userMessage}&rdquo;
                        </p>
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500 font-extrabold">
                          <ArrowRight className="size-3.5 shrink-0" />
                          <span>&ldquo;{corr.correction}&rdquo;</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed pl-2.5 border-l border-slate-300 dark:border-zinc-700">
                          {corr.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {dialogConfig && (
        <CustomDialog
          isOpen={dialogConfig.isOpen}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type="alert"
          confirmText="Đồng ý"
          onConfirm={() => setDialogConfig(null)}
          onCancel={() => setDialogConfig(null)}
          variant={dialogConfig.variant || 'info'}
        />
      )}
    </div>
  )
}