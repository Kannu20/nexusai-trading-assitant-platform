'use client';

// ============================================================
// app/ai-insights/page.tsx — AI chat interface with mock responses
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { AI_RESPONSES } from '@/lib/mockData';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  thinking?: boolean;
};

// Quick prompt suggestions
const QUICK_PROMPTS = [
  { label: 'Analyze Gold', query: 'Analyze gold market trends' },
  { label: 'Silver Outlook', query: 'What is the silver outlook?' },
  { label: 'Crude Oil Risk', query: 'Crude oil risk assessment' },
  { label: 'My Portfolio', query: 'Review my portfolio health' },
  { label: 'Crash Scenario', query: 'Simulate a market crash scenario' },
];

// Match a user query to a mock response key
function matchResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('gold')) return AI_RESPONSES.gold;
  if (q.includes('silver')) return AI_RESPONSES.silver;
  if (q.includes('oil') || q.includes('crude') || q.includes('wti')) return AI_RESPONSES.oil;
  if (q.includes('portfolio') || q.includes('allocation')) return AI_RESPONSES.portfolio;
  if (q.includes('crash') || q.includes('scenario') || q.includes('stress')) return AI_RESPONSES.crash;
  return AI_RESPONSES.default;
}

// Render markdown-lite (bold **text**)
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const initialMessages: Message[] = [
  {
    id: 'init',
    role: 'ai',
    content: "Hello! I'm **NexusAI**, your intelligent investment assistant. I can analyze market trends, assess risk levels, review your portfolio, and run scenario simulations.\n\nAsk me anything about Gold, Silver, Crude Oil, stocks, or your portfolio.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function AIInsightsPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Thinking placeholder
    const thinkingMsg: Message = {
      id: 'thinking',
      role: 'ai',
      content: '',
      time: '',
      thinking: true,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI latency (800–1400ms)
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));

    const aiContent = matchResponse(query);
    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: aiContent,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev.filter((m) => m.id !== 'thinking'), aiMsg]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages(initialMessages);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] animate-slide-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-purple-500 flex items-center justify-center shadow-glow-cyan">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">NexusAI Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green" />
              </span>
              <span className="text-[11px] text-accent-green font-mono">Online · GPT-4 powered</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-white/40 hover:text-white hover:border-border-bright transition-all text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* ── Suggested prompts ── */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => sendMessage(p.query)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-white/50 hover:text-white hover:border-border-bright hover:bg-surface-3 transition-all disabled:opacity-40"
          >
            <TrendingUp className="w-3 h-3" />
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Message thread ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => {
          if (msg.thinking) {
            return (
              <div key="thinking" className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-purple-500 flex items-center justify-center flex-shrink-0 shadow-glow-cyan">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-white/30 ml-1 font-mono">Analyzing markets...</span>
                  </div>
                </div>
              </div>
            );
          }

          const isAI = msg.role === 'ai';
          return (
            <div
              key={msg.id}
              className={cn('flex items-start gap-3 animate-slide-up', !isAI && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  isAI
                    ? 'bg-gradient-to-br from-accent-cyan to-purple-500 shadow-glow-cyan'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                )}
              >
                {isAI ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div className={cn('max-w-[75%]', !isAI && 'items-end flex flex-col')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    isAI
                      ? 'bg-surface-2 border border-border rounded-tl-sm text-white/80'
                      : 'bg-accent-cyan/15 border border-accent-cyan/25 rounded-tr-sm text-white'
                  )}
                >
                  {isAI ? renderContent(msg.content) : msg.content}
                </div>
                {msg.time && (
                  <p className="text-[10px] text-white/25 font-mono mt-1 px-1">{msg.time}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="mt-4 flex-shrink-0">
        <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-2xl focus-within:border-accent-cyan/40 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about market trends, risk levels, or your portfolio..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              input.trim() && !loading
                ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
                : 'bg-surface-3 text-white/20 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-white/20 text-center mt-2 font-mono">
          NexusAI uses mock data for demonstration purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
