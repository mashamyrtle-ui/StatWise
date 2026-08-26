'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { chatApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, Bot, User as UserIcon, Sparkles, BookOpen, Target, HelpCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  { text: "What should I learn next to improve my data science skills for official statistics?", icon: Target },
  { text: "Explain the difference between Stratified Random Sampling and PPS Sampling.", icon: BookOpen },
  { text: "How can I prepare for the upcoming NSSTA Survey Methodology training?", icon: Sparkles },
  { text: "Summarize my top competency gaps and suggest high-impact courses.", icon: HelpCircle }
];

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Namaste ${user?.name?.split(' ')[0] || 'Officer'}! I am your **StatWise AI Learning Assistant**.\n\nI have access to your competency profile, current role requirements, and learning path. How can I assist your capacity-building journey today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await chatApi.send(text, history);
      
      const botMsg: Message = {
        role: 'assistant',
        content: res.data.response || "I apologize, but I couldn't process your request at this moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I encountered an issue connecting to the AI service. Please make sure the backend is running properly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in flex flex-col h-[calc(100vh-2rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={22} className="text-navy-700" /> AI Learning Assistant
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Personalized mentoring tuned to India's Official Statistical System
          </p>
        </div>
        <div className="flex items-center gap-2 bg-navy-50 text-navy-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-navy-200">
          <Sparkles size={14} className="text-amber-500" /> Powered by Gemini & Competency Knowledge Base
        </div>
      </div>

      {/* Chat Container */}
      <div className="gov-card flex-1 flex flex-col overflow-hidden">
        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-3 max-w-3xl',
                m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                  m.role === 'user' ? 'bg-navy-700 text-white' : 'bg-saffron-400 text-white'
                )}
              >
                {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>
              <div>
                <div
                  className={cn(
                    'p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-navy-700 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                  )}
                >
                  {m.content}
                </div>
                <p className={cn('text-[11px] text-slate-400 mt-1', m.role === 'user' ? 'text-right' : '')}>
                  {m.timestamp}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-saffron-400 text-white flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none border border-slate-200/60 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts */}
        {messages.length <= 2 && (
          <div className="px-6 py-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 mb-2">Suggested questions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((prompt, i) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 text-left hover:border-navy-300 hover:bg-navy-50/50 transition-all text-xs text-slate-700 group"
                  >
                    <Icon size={14} className="text-navy-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{prompt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about competencies, statistical concepts, courses, or career guidance..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-navy-700 hover:bg-navy-800 text-white px-5 rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
