// 'use client';

// // ============================================================
// // app/ai-insights/page.tsx — AI chat interface with mock responses
// // ============================================================

// import { useState, useRef, useEffect } from 'react';
// import { Send, Bot, User, Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
// import { AI_RESPONSES } from '@/lib/mockData';
// import { cn } from '@/lib/utils';

// type Message = {
//   id: string;
//   role: 'user' | 'ai';
//   content: string;
//   time: string;
//   thinking?: boolean;
// };

// // Quick prompt suggestions
// const QUICK_PROMPTS = [
//   { label: 'Analyze Gold', query: 'Analyze gold market trends' },
//   { label: 'Silver Outlook', query: 'What is the silver outlook?' },
//   { label: 'Crude Oil Risk', query: 'Crude oil risk assessment' },
//   { label: 'My Portfolio', query: 'Review my portfolio health' },
//   { label: 'Crash Scenario', query: 'Simulate a market crash scenario' },
// ];

// // Match a user query to a mock response key
// function matchResponse(query: string): string {
//   const q = query.toLowerCase();
//   if (q.includes('gold')) return AI_RESPONSES.gold;
//   if (q.includes('silver')) return AI_RESPONSES.silver;
//   if (q.includes('oil') || q.includes('crude') || q.includes('wti')) return AI_RESPONSES.oil;
//   if (q.includes('portfolio') || q.includes('allocation')) return AI_RESPONSES.portfolio;
//   if (q.includes('crash') || q.includes('scenario') || q.includes('stress')) return AI_RESPONSES.crash;
//   return AI_RESPONSES.default;
// }

// // Render markdown-lite (bold **text**)
// function renderContent(text: string) {
//   const parts = text.split(/(\*\*[^*]+\*\*)/g);
//   return parts.map((part, i) => {
//     if (part.startsWith('**') && part.endsWith('**')) {
//       return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
//     }
//     return <span key={i}>{part}</span>;
//   });
// }

// const initialMessages: Message[] = [
//   {
//     id: 'init',
//     role: 'ai',
//     content: "Hello! I'm **NexusAI**, your intelligent investment assistant. I can analyze market trends, assess risk levels, review your portfolio, and run scenario simulations.\n\nAsk me anything about Gold, Silver, Crude Oil, stocks, or your portfolio.",
//     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//   },
// ];

// export default function AIInsightsPage() {
//   const [messages, setMessages] = useState<Message[]>(initialMessages);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const bottomRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   // Auto scroll to bottom
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = async (text?: string) => {
//     const query = (text ?? input).trim();
//     if (!query || loading) return;

//     const userMsg: Message = {
//       id: Date.now().toString(),
//       role: 'user',
//       content: query,
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     };

//     // Thinking placeholder
//     const thinkingMsg: Message = {
//       id: 'thinking',
//       role: 'ai',
//       content: '',
//       time: '',
//       thinking: true,
//     };

//     setMessages((prev) => [...prev, userMsg, thinkingMsg]);
//     setInput('');
//     setLoading(true);

//     // Simulate AI latency (800–1400ms)
//     await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));

//     const aiContent = matchResponse(query);
//     const aiMsg: Message = {
//       id: `ai-${Date.now()}`,
//       role: 'ai',
//       content: aiContent,
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     };

//     setMessages((prev) => [...prev.filter((m) => m.id !== 'thinking'), aiMsg]);
//     setLoading(false);
//     inputRef.current?.focus();
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const handleReset = () => {
//     setMessages(initialMessages);
//     setInput('');
//     setLoading(false);
//   };

//   return (
//     <div className="flex flex-col h-[calc(100vh-9rem)] animate-slide-up">
//       {/* ── Header ── */}
//       <div className="flex items-center justify-between mb-4 flex-shrink-0">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-purple-500 flex items-center justify-center shadow-glow-cyan">
//             <Sparkles className="w-4 h-4 text-white" />
//           </div>
//           <div>
//             <h2 className="text-sm font-semibold text-white">NexusAI Assistant</h2>
//             <div className="flex items-center gap-1.5">
//               <span className="relative flex h-1.5 w-1.5">
//                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
//                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green" />
//               </span>
//               <span className="text-[11px] text-accent-green font-mono">Online · GPT-4 powered</span>
//             </div>
//           </div>
//         </div>
//         <button
//           onClick={handleReset}
//           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-white/40 hover:text-white hover:border-border-bright transition-all text-xs"
//         >
//           <RefreshCw className="w-3.5 h-3.5" />
//           Reset
//         </button>
//       </div>

//       {/* ── Suggested prompts ── */}
//       <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
//         {QUICK_PROMPTS.map((p) => (
//           <button
//             key={p.label}
//             onClick={() => sendMessage(p.query)}
//             disabled={loading}
//             className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-white/50 hover:text-white hover:border-border-bright hover:bg-surface-3 transition-all disabled:opacity-40"
//           >
//             <TrendingUp className="w-3 h-3" />
//             {p.label}
//           </button>
//         ))}
//       </div>

//       {/* ── Message thread ── */}
//       <div className="flex-1 overflow-y-auto space-y-4 pr-1">
//         {messages.map((msg) => {
//           if (msg.thinking) {
//             return (
//               <div key="thinking" className="flex items-start gap-3">
//                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-purple-500 flex items-center justify-center flex-shrink-0 shadow-glow-cyan">
//                   <Bot className="w-4 h-4 text-white" />
//                 </div>
//                 <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
//                   <div className="flex items-center gap-1.5">
//                     <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
//                     <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
//                     <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
//                     <span className="text-xs text-white/30 ml-1 font-mono">Analyzing markets...</span>
//                   </div>
//                 </div>
//               </div>
//             );
//           }

//           const isAI = msg.role === 'ai';
//           return (
//             <div
//               key={msg.id}
//               className={cn('flex items-start gap-3 animate-slide-up', !isAI && 'flex-row-reverse')}
//             >
//               {/* Avatar */}
//               <div
//                 className={cn(
//                   'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
//                   isAI
//                     ? 'bg-gradient-to-br from-accent-cyan to-purple-500 shadow-glow-cyan'
//                     : 'bg-gradient-to-br from-purple-500 to-pink-500'
//                 )}
//               >
//                 {isAI ? (
//                   <Bot className="w-4 h-4 text-white" />
//                 ) : (
//                   <User className="w-4 h-4 text-white" />
//                 )}
//               </div>

//               {/* Bubble */}
//               <div className={cn('max-w-[75%]', !isAI && 'items-end flex flex-col')}>
//                 <div
//                   className={cn(
//                     'rounded-2xl px-4 py-3 text-sm leading-relaxed',
//                     isAI
//                       ? 'bg-surface-2 border border-border rounded-tl-sm text-white/80'
//                       : 'bg-accent-cyan/15 border border-accent-cyan/25 rounded-tr-sm text-white'
//                   )}
//                 >
//                   {isAI ? renderContent(msg.content) : msg.content}
//                 </div>
//                 {msg.time && (
//                   <p className="text-[10px] text-white/25 font-mono mt-1 px-1">{msg.time}</p>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//         <div ref={bottomRef} />
//       </div>

//       {/* ── Input bar ── */}
//       <div className="mt-4 flex-shrink-0">
//         <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-2xl focus-within:border-accent-cyan/40 transition-colors">
//           <input
//             ref={inputRef}
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder="Ask about market trends, risk levels, or your portfolio..."
//             disabled={loading}
//             className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50"
//           />
//           <button
//             onClick={() => sendMessage()}
//             disabled={!input.trim() || loading}
//             className={cn(
//               'w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
//               input.trim() && !loading
//                 ? 'bg-accent-cyan text-surface hover:bg-accent-cyan/90 shadow-glow-cyan'
//                 : 'bg-surface-3 text-white/20 cursor-not-allowed'
//             )}
//           >
//             <Send className="w-4 h-4" />
//           </button>
//         </div>
//         <p className="text-[10px] text-white/20 text-center mt-2 font-mono">
//           NexusAI uses mock data for demonstration purposes only. Not financial advice.
//         </p>
//       </div>
//     </div>
//   );
// }

'use client';

// ================================================================
// app/ai-insights/page.tsx — Real AI chat powered by OpenRouter
// ================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, Sparkles, RefreshCw, TrendingUp,
  Zap, Copy, Check, AlertCircle, WifiOff, Info,
  BarChart2, ShieldAlert, Brain, Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────
type Role = 'user' | 'ai';

interface Message {
  id:       string;
  role:     Role;
  content:  string;
  time:     string;
  thinking?: boolean;
  error?:    boolean;
  model?:    string;
}

// ── Quick prompts (richer, context-aware) ─────────────────────────
const QUICK_PROMPTS = [
  { label: '📊 Gold Analysis',    query: 'Give me a detailed technical and fundamental analysis of Gold (XAU/USD) including key support/resistance levels and price outlook.' },
  { label: '🛢️ Crude Oil Outlook', query: 'What are the key drivers for WTI Crude Oil right now? Include OPEC dynamics, demand outlook, and risk factors.' },
  { label: '⚡ NVIDIA Deep Dive',  query: 'Analyze NVIDIA (NVDA) — AI chip demand, competitive moat, valuation, and what could move the stock next.' },
  { label: '💼 Portfolio Review',  query: 'I hold Gold, Apple (AAPL), Crude Oil, and NVIDIA in my portfolio. Review diversification, correlation risk, and suggest rebalancing.' },
  { label: '🛡️ Risk Assessment',  query: 'What are the biggest macro risks to a multi-asset portfolio of stocks and commodities right now?' },
  { label: '📉 Crash Simulation', query: 'If global markets crash 25%, walk me through likely impact on Gold, Silver, tech stocks, and oil — and which assets would provide the best hedge.' },
  { label: '🥈 Silver Catalyst',  query: 'What catalysts could drive Silver higher? Include industrial demand trends, solar energy adoption, and technical setup.' },
  { label: '🌍 Macro Overview',   query: 'Give me a concise macro overview: central bank policies, inflation trends, dollar strength, and implications for commodities vs equities.' },
];

// ── Markdown-lite renderer ────────────────────────────────────────
// Handles: **bold**, bullet points (• or -), → arrows, line breaks
function renderContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={li} className="h-2" />;

    // Parse inline bold (**text**)
    const parseBold = (str: string) => {
      const parts = str.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      );
    };

    // Bullet line
    if (/^[•\-\*]\s/.test(trimmed)) {
      return (
        <div key={li} className="flex items-start gap-2 my-0.5">
          <span className="text-accent-cyan mt-1.5 flex-shrink-0 text-[8px]">◆</span>
          <span>{parseBold(trimmed.replace(/^[•\-\*]\s/, ''))}</span>
        </div>
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)?.[1];
      return (
        <div key={li} className="flex items-start gap-2 my-0.5">
          <span className="text-accent-cyan font-mono text-[10px] mt-0.5 flex-shrink-0 w-4">{num}.</span>
          <span>{parseBold(trimmed.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    }

    // Regular paragraph with → support
    return (
      <p key={li} className="my-0.5 leading-relaxed">
        {parseBold(line)}
      </p>
    );
  });
}

// ── Copy button ───────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-white/60 transition-all"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Model badge ───────────────────────────────────────────────────
function ModelBadge({ model }: { model?: string }) {
  if (!model) return null;
  const short = model.split('/').pop()?.split(':')[0] ?? model;
  return (
    <span className="text-[9px] font-mono text-white/20 px-1.5 py-0.5 rounded bg-surface-3 border border-border">
      {short}
    </span>
  );
}

// ── Initial greeting ──────────────────────────────────────────────
const INITIAL_MESSAGE: Message = {
  id:      'init',
  role:    'ai',
  content: `Hello! I'm **NexusAI**, your intelligent investment assistant powered by advanced AI.\n\nI can help you with:\n• **Market Analysis** — deep dives on stocks, commodities, forex\n• **Portfolio Review** — diversification, risk scoring, rebalancing\n• **Technical Analysis** — RSI, moving averages, support/resistance\n• **Macro Insights** — central banks, inflation, geopolitical risk\n• **Scenario Simulation** — crash scenarios, stress testing\n\nAsk me anything — or pick a quick prompt below to get started.`,
  time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// ── Main page ─────────────────────────────────────────────────────
export default function AIInsightsPage() {
  const [messages, setMessages]   = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'mock' | 'error'>('unknown');
  const [currentModel, setCurrentModel] = useState<string>('');
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check API on mount (silent probe)
  useEffect(() => {
    const probe = async () => {
      try {
        const r = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
        });
        if (r.status === 503) setApiStatus('mock');
        else if (r.ok) setApiStatus('ok');
        else setApiStatus('error');
      } catch {
        setApiStatus('error');
      }
    };
    probe();
  }, []);

  // Build history for API (convert Message[] → ChatMessage[])
  const buildHistory = useCallback((msgs: Message[]) =>
    msgs
      .filter((m) => !m.thinking && !m.error && m.id !== 'init')
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.content })),
    []
  );

  const sendMessage = useCallback(async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id:      `u-${Date.now()}`,
      role:    'user',
      content: query,
      time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const thinkingMsg: Message = {
      id: 'thinking', role: 'ai', content: '', time: '', thinking: true,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history including the new user message
      const history = [...buildHistory(messages), { role: 'user' as const, content: query }];

      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const aiMsg: Message = {
        id:      `ai-${Date.now()}`,
        role:    'ai',
        content: data.content,
        time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model:   data.model,
      };

      if (data.model) setCurrentModel(data.model);
      setApiStatus('ok');
      setMessages((prev) => [...prev.filter((m) => m.id !== 'thinking'), aiMsg]);

    } catch (err: any) {
      // Check if it's a "no API key" error → use mock fallback
      const errMsg = err.message ?? 'Something went wrong';
      const isMock = errMsg.includes('OPENROUTER_API_KEY') || errMsg.includes('503');

      if (isMock) {
        setApiStatus('mock');
        // Use a generic fallback response
        const fallback = getMockFallback(query);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== 'thinking'),
          {
            id:      `ai-${Date.now()}`,
            role:    'ai',
            content: fallback,
            time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setApiStatus('error');
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== 'thinking'),
          {
            id:      `err-${Date.now()}`,
            role:    'ai',
            content: `⚠️ **Error:** ${errMsg}`,
            time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            error:   true,
          },
        ]);
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, buildHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setLoading(false);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] animate-slide-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-purple-500 flex items-center justify-center shadow-glow-cyan">
            <Sparkles className="w-4 h-4 text-white" />
            {apiStatus === 'ok' && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-surface" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">NexusAI Assistant</h2>
              {currentModel && <ModelBadge model={currentModel} />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {apiStatus === 'ok' ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green" />
                  </span>
                  <span className="text-[11px] text-accent-green font-mono">Live · OpenRouter AI</span>
                </>
              ) : apiStatus === 'mock' ? (
                <>
                  <WifiOff className="w-3 h-3 text-accent-amber" />
                  <span className="text-[11px] text-accent-amber font-mono">Mock mode — add OPENROUTER_API_KEY</span>
                </>
              ) : apiStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3 h-3 text-accent-red" />
                  <span className="text-[11px] text-accent-red font-mono">Connection error</span>
                </>
              ) : (
                <span className="text-[11px] text-white/30 font-mono">Connecting...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-[10px] font-mono text-white/30">
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {messages.filter((m) => m.role === 'ai' && !m.thinking && m.id !== 'init').length} responses
            </span>
            <span className="w-px h-3 bg-border" />
            <span>{messages.filter((m) => m.role === 'user').length} queries</span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-white/40 hover:text-white hover:border-border-bright transition-all text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* ── API key notice (mock mode) ── */}
      {apiStatus === 'mock' && (
        <div className="mb-3 flex-shrink-0 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-accent-amber/8 border border-accent-amber/20 text-xs text-accent-amber/80">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Add <code className="bg-surface-3 px-1 py-0.5 rounded font-mono text-accent-amber">OPENROUTER_API_KEY</code> to <code className="bg-surface-3 px-1 py-0.5 rounded font-mono">.env.local</code> for real AI responses.
            Free models available at <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="underline">openrouter.ai</a>.
          </span>
        </div>
      )}

      {/* ── Quick prompts ── */}
      <div className="flex gap-2 mb-3 flex-shrink-0 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => sendMessage(p.query)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 border border-border text-xs text-white/50 hover:text-white hover:border-border-bright hover:bg-surface-3 transition-all disabled:opacity-40 whitespace-nowrap flex-shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Message thread ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {messages.map((msg) => {

          // ── Thinking bubble ──
          if (msg.thinking) {
            return (
              <div key="thinking" className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-purple-500 flex items-center justify-center flex-shrink-0 shadow-glow-cyan">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                    <span className="text-xs text-white/30 ml-1 font-mono">Analyzing with AI...</span>
                  </div>
                </div>
              </div>
            );
          }

          const isAI = msg.role === 'ai';

          return (
            <div
              key={msg.id}
              className={cn('flex items-start gap-3 animate-slide-up group', !isAI && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                isAI
                  ? 'bg-gradient-to-br from-accent-cyan to-purple-500 shadow-glow-cyan'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              )}>
                {isAI ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
              </div>

              {/* Bubble */}
              <div className={cn('max-w-[78%]', !isAI && 'items-end flex flex-col')}>
                <div className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed relative',
                  isAI && !msg.error
                    ? 'bg-surface-2 border border-border rounded-tl-sm text-white/80'
                    : isAI && msg.error
                    ? 'bg-accent-red/8 border border-accent-red/25 rounded-tl-sm text-accent-red/80'
                    : 'bg-accent-cyan/10 border border-accent-cyan/20 rounded-tr-sm text-white'
                )}>
                  {isAI ? renderContent(msg.content) : <p>{msg.content}</p>}
                </div>

                {/* Footer: time + model + copy */}
                <div className={cn('flex items-center gap-2 mt-1 px-1', !isAI && 'flex-row-reverse')}>
                  {msg.time && (
                    <p className="text-[10px] text-white/25 font-mono">{msg.time}</p>
                  )}
                  {isAI && msg.model && <ModelBadge model={msg.model} />}
                  {isAI && !msg.error && <CopyButton text={msg.content} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="mt-3 flex-shrink-0">
        <div className={cn(
          'flex items-end gap-3 p-3 rounded-2xl border transition-all',
          loading
            ? 'bg-surface-2 border-border/50'
            : 'bg-surface-2 border-border focus-within:border-accent-cyan/40 focus-within:bg-surface-3'
        )}>
          {/* Textarea (auto-resize) */}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about market trends, specific stocks, macro risks, portfolio strategies..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50 resize-none overflow-hidden min-h-[20px] max-h-[120px] leading-relaxed"
            style={{ height: 'auto' }}
          />

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Hint: Shift+Enter */}
            {input.length > 0 && (
              <span className="hidden sm:block text-[9px] text-white/20 font-mono">
                Shift+↵ newline
              </span>
            )}

            {/* Send button */}
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
              {loading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-white/20 font-mono">
            {apiStatus === 'ok'
              ? `⚡ Powered by OpenRouter · ${(process.env.NEXT_PUBLIC_OPENROUTER_MODEL ?? 'LLaMA 3.1').split('/').pop()?.split(':')[0]}`
              : '⚠️ Not financial advice — for informational purposes only'}
          </p>
          <p className="text-[10px] text-white/15 font-mono">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  );
}

// ── Mock fallback responses (when no API key) ─────────────────────
function getMockFallback(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('gold') || q.includes('xau')) {
    return `**Gold (XAU/USD) Analysis**\n\n**Current Setup:** Gold continues to trade as a key safe-haven asset amid elevated geopolitical uncertainty and central bank buying.\n\n**Key Technical Levels:**\n• Support: $2,280 – $2,300 zone (200-day SMA)\n• Resistance: $2,360 – $2,400 (psychological + prior highs)\n\n**Bullish Drivers:**\n• Central bank gold accumulation at multi-decade highs\n• Real yields declining — historically positive for gold\n• Dollar weakening trend providing tailwind\n\n**Price Target:**\n→ 7-day: $2,350 – $2,380\n→ 30-day: $2,400 – $2,450 (bull case)\n\n**Risk Note:** A stronger-than-expected US jobs report or Fed hawkish pivot could pressure prices toward $2,250 support. Position sizing accordingly.`;
  }

  if (q.includes('oil') || q.includes('crude') || q.includes('wti')) {
    return `**WTI Crude Oil Analysis**\n\nCrude oil faces a tug-of-war between supply discipline and demand uncertainty.\n\n**Key Factors:**\n• OPEC+ maintaining production cuts — floor support near $75-76\n• China demand recovery slower than anticipated — near-term headwind\n• US Strategic Petroleum Reserve refilling providing demand support\n\n**Technical Picture:**\n• Trading below 50-day SMA — technically bearish short-term\n• RSI near 42 — not yet oversold\n• Key support: $76 / Key resistance: $81-82\n\n**Outlook:** Neutral to slightly bearish near-term. Watch for EIA inventory data Wednesday.\n\n**Risk Note:** Geopolitical escalation in Middle East = sudden spike risk. Manage downside with defined stops.`;
  }

  if (q.includes('portfolio') || q.includes('diversif')) {
    return `**Portfolio Health Assessment**\n\nBased on a portfolio of Gold, AAPL, Crude Oil, and NVDA:\n\n**Diversification Score: 68/100** — Moderate\n\n**Correlation Risk:**\n• NVDA + AAPL are highly correlated (tech sector β > 1.2)\n• Gold acts as a partial hedge — low correlation to equities\n• Crude Oil adds commodity exposure but limited hedge value\n\n**Rebalancing Suggestions:**\n• Reduce tech concentration to < 40% of total\n• Consider adding Silver or Copper for commodity diversification\n• Add short-duration bonds (TLT, BND) to reduce overall volatility\n\n**Risk Level: Medium** — Significant tech concentration warrants monitoring during high-volatility regimes.\n\n**Risk Note:** Past correlation patterns may break down during systemic risk events (2008, 2020 style).`;
  }

  if (q.includes('crash') || q.includes('scenario')) {
    return `**Market Crash Scenario Analysis (-25%)**\n\nStress-testing your portfolio against a 25% broad market decline:\n\n**Estimated Portfolio Impact:**\n• NVDA: -35 to -45% (high-beta tech)\n• AAPL: -20 to -28% (defensive tech, cash-rich)\n• Crude Oil: -30 to -40% (demand destruction)\n• Gold: -5 to +8% (flight-to-safety partially offsets)\n\n**Net Portfolio Drawdown: ~-28 to -32%**\n\n**Hedge Recommendations:**\n• Increase Gold to 20-25% → reduces drawdown to ~-22%\n• Add Silver (5-8%) for additional safe-haven exposure\n• Consider put options on SPY or QQQ as tail risk hedge\n\n**Historical Context:** In 2020 COVID crash, Gold fell briefly then rallied strongly while equities took months to recover.\n\n**Risk Note:** No hedge is perfect. Diversification reduces but cannot eliminate portfolio drawdown.`;
  }

  // Default
  return `Thank you for your question about **${query.slice(0, 60)}${query.length > 60 ? '...' : ''}**.\n\nTo get real AI-powered analysis, please add your **OpenRouter API key** to \`.env.local\`:\n\n\`\`\`\nOPENROUTER_API_KEY=sk-or-v1-your-key-here\n\`\`\`\n\nFree models are available at openrouter.ai — the \`meta-llama/llama-3.1-8b-instruct:free\` model works great for financial analysis.\n\nOnce configured, I can provide:\n• Real-time AI analysis of any asset\n• Portfolio optimization advice\n• Risk assessment and scenario modeling\n• Technical and fundamental analysis`;
}