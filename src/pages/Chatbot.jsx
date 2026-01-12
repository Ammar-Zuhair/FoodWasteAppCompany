import { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { getStoredUser } from "../utils/api/auth.js";
import * as chatbotAPI from "../utils/api/chatbot.js";

function Chatbot({ user: propUser }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
    name: storedUser.full_name || storedUser.name,
  } : null);

  // State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Theme colors
  const isDark = theme === "dark";
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const bgCard = isDark ? "bg-slate-900" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const borderColor = isDark ? "border-slate-800" : "border-slate-200";

  // Listen for header button click
  useEffect(() => {
    const handleOpenHistory = () => setShowDrawer(true);
    window.addEventListener('openChatHistory', handleOpenHistory);
    return () => window.removeEventListener('openChatHistory', handleOpenHistory);
  }, []);

  // Handle keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardH = windowHeight - viewportHeight;
        setKeyboardHeight(keyboardH > 0 ? keyboardH : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instant ? "auto" : "smooth",
        block: "end"
      });
    }
  };

  useEffect(() => {
    // التمرير للأسفل عند وصول رسالة جديدة أو تغيير حالة التحميل
    // نستخدم عدة محاولات للتأكد من ظهور الرسالة بالكامل
    const timer1 = setTimeout(() => scrollToBottom(), 100);
    const timer2 = setTimeout(() => scrollToBottom(), 300);
    const timer3 = setTimeout(() => scrollToBottom(), 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [messages, loading]);

  useEffect(() => {
    if (keyboardHeight > 0) {
      // تمرير فوري عند فتح الكيبورد وتمرير ناعم بعده بلحظة
      scrollToBottom(true);
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [keyboardHeight]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await chatbotAPI.getSessions();
      setSessions(data);
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setLoading(true);
      const data = await chatbotAPI.getSession(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(data.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
      })));
      setShowDrawer(false);
    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setLoading(false);
    }
  };



  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInputMessage("");
    setShowDrawer(false);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setLoading(true);

    // إبقاء التركيز على حقل الإدخال مباشرة
    inputRef.current?.focus();

    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    }]);

    try {
      const response = await chatbotAPI.sendChatMessage(
        userMessage,
        currentSessionId,
        "chatgpt",
        true
      );

      if (response.success) {
        if (response.session_id && !currentSessionId) {
          setCurrentSessionId(response.session_id);
          loadSessions();
        }

        setMessages(prev => [...prev, {
          role: "assistant",
          content: response.response,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: language === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred.",
          isError: true,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: language === "ar" ? "عذراً، خطأ في الاتصال." : "Sorry, connection error.",
        isError: true,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      // إبقاء التركيز على حقل الإدخال والتمرير للأسفل
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        scrollToBottom();
      });
    }
  };

  const handleArchiveSession = async (sessionId) => {
    try {
      await chatbotAPI.archiveSession(sessionId);
      loadSessions();
      if (currentSessionId === sessionId) handleNewChat();
    } catch (err) {
      console.error("Error archiving:", err);
    }
  };

  const suggestions = [
    language === "ar" ? "ما هي أكثر أسباب الهدر؟" : "Top waste causes?",
    language === "ar" ? "فائض للتبرع؟" : "Surplus for donation?",
    language === "ar" ? "أداء المبيعات" : "Sales performance",
    language === "ar" ? "توصيات التخزين" : "Storage tips",
  ];

  const inputBottom = keyboardHeight > 0 ? keyboardHeight : 0;

  return (
    <div
      className={`${bgMain}`}
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* القائمة الجانبية - Drawer */}
      {showDrawer && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer */}
          <div
            className={`fixed top-0 bottom-0 ${language === "ar" ? "right-0" : "left-0"} w-[85%] max-w-sm z-50 ${isDark ? "bg-slate-900" : "bg-white"} shadow-2xl flex flex-col`}
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Drawer Header */}
            <div className={`flex items-center justify-between px-4 py-4 border-b ${borderColor}`}>
              <h2 className={`text-lg font-bold ${textPrimary}`}>
                {language === "ar" ? "المحادثات" : "Chats"}
              </h2>
              <div className="flex items-center gap-2">
                {/* زر دردشة جديدة */}
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#429EBD] text-white text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {language === "ar" ? "جديدة" : "New"}
                </button>
                {/* زر إغلاق */}
                <button
                  onClick={() => setShowDrawer(false)}
                  className={`p-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length > 0 ? sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${currentSessionId === session.id
                    ? `${isDark ? "bg-[#429EBD]/20 border-[#429EBD]" : "bg-[#429EBD]/10 border-[#429EBD]"} border-2`
                    : `${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-50 hover:bg-slate-100"} border ${borderColor}`
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${textPrimary}`}>
                        {session.title || (language === "ar" ? "محادثة" : "Chat")}
                      </p>
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveSession(session.id);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <div className={`w-14 h-14 rounded-2xl ${isDark ? "bg-slate-800" : "bg-slate-100"} mx-auto mb-3 flex items-center justify-center`}>
                    <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className={`text-sm ${textSecondary}`}>
                    {language === "ar" ? "لا توجد محادثات" : "No chats yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Messages Area - يملأ كل المساحة المتاحة */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: `${inputBottom + 120}px`, // زيادة المساحة لضمان ظهور الرسائل فوق حقل الإدخال
          paddingTop: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {messages.length === 0 ? (
          // شاشة الترحيب - تملأ كل المساحة
          <div
            className="flex flex-col items-center justify-center px-4"
            style={{ minHeight: '100%' }}
          >
            {/* شعار التطبيق */}
            <div className={`w-28 h-28 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6 p-4`}>
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className={`text-2xl font-bold ${textPrimary} mb-3 text-center`}>
              {language === "ar" ? "مرحباً! كيف أساعدك؟" : "Hello! How can I help?"}
            </h2>
            <p className={`text-base ${textSecondary} mb-8 max-w-xs text-center leading-relaxed`}>
              {language === "ar" ? "اسألني عن تحليل البيانات والتوصيات الذكية" : "Ask me about data analysis & smart recommendations"}
            </p>

            {/* Quick Suggestions */}
            <div className="w-full space-y-3 max-w-md">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInputMessage(s); inputRef.current?.focus(); }}
                  className={`w-full text-start px-5 py-4 rounded-2xl border-2 ${borderColor} ${isDark ? "bg-slate-900" : "bg-white"} ${textPrimary} text-base font-medium active:scale-[0.98] transition-transform shadow-sm`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#429EBD] flex-shrink-0" />
                    {s}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // رسائل المحادثة
          <div className="space-y-3 py-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-base ${msg.role === "user"
                  ? "bg-[#429EBD] text-white rounded-br-sm"
                  : msg.isError
                    ? "bg-red-100 text-red-700"
                    : `${isDark ? "bg-slate-800" : "bg-white"} ${textPrimary} border ${borderColor} rounded-bl-sm shadow-sm`
                  }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.timestamp && (
                    <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-white/70" : textSecondary}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`px-4 py-3 rounded-2xl ${isDark ? "bg-slate-800" : "bg-white"} border ${borderColor} shadow-sm`}>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#429EBD] rounded-full animate-bounce" />
                    <span className="w-2.5 h-2.5 bg-[#429EBD] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2.5 h-2.5 bg-[#429EBD] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-20" /> {/* مساحة كبيرة للتمرير */}
          </div>
        )}
      </div>

      {/* Input Area - في الأسفل تماماً */}
      <div
        className={`fixed left-0 right-0 px-4 py-3 ${bgCard} border-t ${borderColor} z-30`}
        style={{
          bottom: `${inputBottom}px`,
          paddingBottom: `max(12px, env(safe-area-inset-bottom))`,
        }}
      >
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            // أزلنا disabled={loading} لمنع انغلاق الكيبورد
            autoFocus
            placeholder={language === "ar" ? "اكتب رسالتك هنا..." : "Type your message..."}
            className={`flex-1 px-4 py-3.5 rounded-2xl border-2 ${borderColor} ${isDark ? "bg-slate-800 text-white placeholder-slate-500" : "bg-slate-50 text-slate-900"} text-base focus:outline-none focus:border-[#429EBD] transition-colors`}
            style={{ fontSize: '16px' }}
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            onMouseDown={(e) => e.preventDefault()} // منع فقدان التركيز من حقل الإدخال
            onTouchStart={(e) => e.preventDefault()} // منع فقدان التركيز على الموبايل
            onClick={(e) => {
              e.preventDefault();
              handleSend(e);
            }}
            className={`p-3.5 rounded-2xl transition-all ${!inputMessage.trim() || loading
              ? `${isDark ? "bg-slate-800" : "bg-slate-200"} ${textSecondary}`
              : "bg-[#429EBD] text-white shadow-lg shadow-[#429EBD]/30"
              }`}
          >
            <svg className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
