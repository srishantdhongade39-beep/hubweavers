import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Groq from 'groq-sdk';

const MENTOR_SYSTEM_PROMPT = `You are FinIQ Assistant — an expert personal finance mentor for Indian students. Explain concepts with real Indian examples. Never give actual investment advice. Always end with a follow-up question or watch-out tip. Keep every response under 100 words.`;

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I am FinIQ — your AI assistant. I can answer any questions you have about courses or finance. What's on your mind?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const location = useLocation();

  const getPageContext = () => {
    if (location.pathname.includes("learn")) return "User is reading a finance lesson module.";
    if (location.pathname.includes("bookiq")) return "User is reading an investment book summary.";
    if (location.pathname.includes("track")) return "User is viewing their portfolio tracker.";
    if (location.pathname.includes("profile")) return "User is looking at their profile settings.";
    if (location.pathname.includes("quiz")) return "User is taking a finance quiz.";
    return "User is on the FinIQ app home page.";
  };

  const dynamicSystemPrompt = `${MENTOR_SYSTEM_PROMPT}\nCurrent page context: ${getPageContext()}`;

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
        dangerouslyAllowBrowser: true 
      });

      const apiMessages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant')
                   .map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content }
      ];

      const response = await groq.chat.completions.create({
        messages: apiMessages,
        model: "llama-3.3-70b-versatile",
      });

      const reply = response.choices[0]?.message?.content || "No response generated";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "My connection failed! Error: " + err.message }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Ask FinIQ"
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: '#1DB88E' }}
      >
        {isOpen ? (
           <span className="text-2xl mt-0.5">✕</span>
        ) : (
           <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 lg:bottom-28 lg:right-10 z-[100] w-80 sm:w-96 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col border border-gray-100 overflow-hidden animate-slide-up" style={{ height: '500px' }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#0D2B1F' }}>
            <div className="flex items-center gap-2 text-white">
              <span className="w-7 h-7 rounded-full bg-white/20 flex inset-0 items-center justify-center text-xs font-bold text-white tracking-widest mr-1">IQ</span>
              <span className="text-sm font-bold">Ask FinIQ</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-2 mt-1 shrink-0" style={{ backgroundColor: '#1DB88E' }}>FI</div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'text-white rounded-br-sm' : 'bg-white text-gray-700 shadow-sm border border-gray-400/10 rounded-bl-sm'}`} style={msg.role === 'user' ? { backgroundColor: '#1DB88E' } : {}}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                 <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-2 mt-1 shrink-0" style={{ backgroundColor: '#1DB88E' }}>FI</div>
                 <div className="bg-white shadow-sm border border-gray-100 px-4 py-2 flex items-center rounded-2xl rounded-bl-sm gap-1">
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                 </div>
               </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Ask me a question..."
                className="flex-1 text-[13px] bg-gray-50 px-4 py-2.5 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1DB88E]"
              />
              <button
                disabled={!input.trim() || isTyping}
                onClick={sendMessage}
                className="h-[42px] w-[42px] flex items-center justify-center rounded-xl text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#1DB88E' }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
