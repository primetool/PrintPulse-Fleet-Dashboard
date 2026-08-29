import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Terminal, 
  TrendingDown, 
  Wrench, 
  Layers, 
  Copy, 
  Check, 
  Trash2, 
  Cpu, 
  Zap, 
  Clock, 
  ChevronDown, 
  CheckCircle2, 
  ArrowRight,
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { FleetMetrics, PrinterDevice, ComputerNode } from '../types';

export type ChatRole = 'general_copilot' | 'devops_engineer' | 'cost_auditor' | 'hardware_specialist';
export type ModelChoice = 'auto' | 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  modelReason?: string;
  roleUsed?: string;
}

interface GeminiChatbotProps {
  metrics?: FleetMetrics | null;
  printers?: PrinterDevice[];
  workstations?: ComputerNode[];
  initialRole?: ChatRole;
  compactMode?: boolean;
}

const PERSONAS: Array<{
  id: ChatRole;
  name: string;
  badge: string;
  icon: any;
  desc: string;
  recommendedModel: string;
  suggestedPrompts: string[];
}> = [
  {
    id: 'general_copilot',
    name: 'General Fleet Copilot',
    badge: 'General Ops',
    icon: Bot,
    desc: 'Fleet health summaries, daily operations, cross-department telemetry',
    recommendedModel: 'gemini-3.5-flash',
    suggestedPrompts: [
      'Give me an executive summary of current fleet health.',
      'Which department has printed the most volume today?',
      'Are there any offline workstations or erroring print queues?',
      'How many total pages and cost have been recorded today?'
    ]
  },
  {
    id: 'devops_engineer',
    name: 'Fleet DevOps & Scripting',
    badge: 'SysAdmin / Automation',
    icon: Terminal,
    desc: 'PowerShell scripts, CUPS configuration, spooler service automation, GPO policies',
    recommendedModel: 'gemini-3.1-pro-preview',
    suggestedPrompts: [
      'Generate a PowerShell script to restart spoolers and purge orphaned .SPL files.',
      'How do I set default duplex printing on CUPS for all Linux stations?',
      'Write a bash script to monitor CUPS error_log for stalled jobs.',
      'Provide a Windows GPO PowerShell one-liner to deploy network printers.'
    ]
  },
  {
    id: 'cost_auditor',
    name: 'Cost & Sustainability Auditor',
    badge: 'Finance / Green IT',
    icon: TrendingDown,
    desc: 'Duplex policy savings, color quota management, paper waste & CO2 reduction',
    recommendedModel: 'gemini-3.5-flash',
    suggestedPrompts: [
      'How can we reduce color printing expenses in Design & Marketing?',
      'Calculate our monthly paper and dollar savings from duplex enforcement.',
      'What is our total CO2 avoided this week, and how is it calculated?',
      'Suggest a departmental quota policy to restrict runaway print jobs.'
    ]
  },
  {
    id: 'hardware_specialist',
    name: 'Hardware & Diagnostics',
    badge: 'Hardware & Maintenance',
    icon: Wrench,
    desc: 'CMYK cartridge run-out forecasts, drum unit health, jam clearance, part SKUs',
    recommendedModel: 'gemini-3.1-flash-lite',
    suggestedPrompts: [
      'Which printers are predicted to run out of toner in the next 3 days?',
      'What OEM replacement cartridge packs do we need for our Epson and Canon units?',
      'How do I clear a Tray 1 sensor misfeed error on the Brother HL-L6400DW?',
      'What is the current drum unit health percentage across the fleet?'
    ]
  }
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  metrics,
  printers = [],
  workstations = [],
  initialRole = 'general_copilot',
  compactMode = false,
}) => {
  const [activeRole, setActiveRole] = useState<ChatRole>(initialRole);
  const [modelPreference, setModelPreference] = useState<ModelChoice>('auto');
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: `Hello! I am your **PrintPulse Gemini AI Fleet Copilot**. I am connected directly to live telemetry across **${workstations.length || 7} workstations** and **${printers.length || 5} network printers**.\n\nYou can switch my specialized role above (e.g. *Fleet DevOps*, *Cost Auditor*, *Hardware Specialist*) or ask me anything about print spoolers, PowerShell scripts, toner run-out forecasting, or green print policies!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
      roleUsed: 'General Fleet Copilot'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const currentPersona = PERSONAS.find(p => p.id === activeRole) || PERSONAS[0];

  const handleSendMessage = async (promptOverride?: string) => {
    const textToSend = promptOverride || chatInput;
    if (!textToSend.trim() || isSending) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        content: textToSend.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];

    setMessages(newMessages);
    setChatInput('');
    setIsSending(true);

    try {
      // Build history for multi-turn Gemini conversation
      const historyPayload = newMessages
        .filter(m => m.id !== userMessageId)
        .slice(-8)
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

      // Map model selection / complexity
      let taskComplexity: string | undefined = undefined;
      if (modelPreference === 'gemini-3.1-pro-preview') taskComplexity = 'complex';
      else if (modelPreference === 'gemini-3.1-flash-lite') taskComplexity = 'fast';
      else if (modelPreference === 'gemini-3.5-flash') taskComplexity = 'general';

      const response = await fetch('/api/printpulse/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          chatHistory: historyPayload,
          rolePersona: activeRole,
          modelPreference: modelPreference,
          taskComplexity: taskComplexity,
        })
      });

      const data = await response.json();

      if (data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: data.modelUsed || 'gemini-3.5-flash',
            modelReason: data.modelReason,
            roleUsed: data.roleUsed || currentPersona.name,
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: 'I analyzed the fleet telemetry, but could not produce a detailed response. Please try phrasing your question differently.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: 'telemetry_engine',
          }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to connect to the Gemini intelligence endpoint. Please verify your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'telemetry_engine',
        }
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. I am in **${currentPersona.name}** mode. How can I help you manage your print fleet today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
        roleUsed: currentPersona.name
      }
    ]);
  };

  const handleExportChat = () => {
    const textContent = messages
      .map(m => `[${m.timestamp}] ${m.role === 'user' ? 'USER' : `GEMINI (${m.modelUsed || 'AI'})`}:\n${m.content}\n\n`)
      .join('---\n');
    
    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printpulse-gemini-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getModelBadgeInfo = (modelName?: string) => {
    if (!modelName) return { label: 'Gemini 3.5 Flash', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (modelName.includes('3.1-pro')) {
      return { label: 'Gemini 3.1 Pro (Complex Reasoning)', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Cpu };
    }
    if (modelName.includes('3.1-flash-lite')) {
      return { label: 'Gemini 3.1 Flash-Lite (Ultra Fast)', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Zap };
    }
    if (modelName.includes('3.5-flash') || modelName.includes('3.7-flash')) {
      return { label: 'Gemini 3.5 Flash (General Fleet)', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Sparkles };
    }
    return { label: modelName, color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Bot };
  };

  return (
    <div id="gemini-chatbot-container" className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[740px] overflow-hidden">
      
      {/* Top Header with Role Switcher & Model Selector */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Chatbot Identity & Live Grounding Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">PrintPulse Gemini Chatbot</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Telemetry Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Multi-turn intelligence for fleet automation, scripting, and toner forecasting
              </p>
            </div>
          </div>

          {/* Model Selection & Chat Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Model Selector Dropdown */}
            <div className="relative inline-block text-left">
              <select
                id="gemini-model-selector"
                value={modelPreference}
                onChange={(e) => setModelPreference(e.target.value as ModelChoice)}
                className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 pr-8 appearance-none shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="auto">✨ Auto Model (Adaptive)</option>
                <option value="gemini-3.1-pro-preview">🧠 Gemini 3.1 Pro (Complex Tasks & Scripts)</option>
                <option value="gemini-3.5-flash">⚡ Gemini 3.5 Flash (General Tasks)</option>
                <option value="gemini-3.1-flash-lite">🚀 Gemini 3.1 Flash-Lite (Fast Lookups)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Export transcript */}
            <button
              onClick={handleExportChat}
              title="Export conversation history to Markdown"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear history */}
            <button
              onClick={handleClearHistory}
              title="Clear conversation history"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Specialized Persona Selector Chips */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            Role:
          </span>
          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = activeRole === persona.id;
            return (
              <button
                key={persona.id}
                id={`btn-persona-${persona.id}`}
                onClick={() => setActiveRole(persona.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{persona.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {persona.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
        
        {/* Active Role Persona Header Info Callout */}
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <strong>System Instruction Active:</strong> {currentPersona.desc}. Model routing prefers <code className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono text-[11px] font-bold">{currentPersona.recommendedModel}</code>.
          </div>
        </div>

        {/* Message Thread */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const badgeInfo = !isUser ? getModelBadgeInfo(msg.modelUsed) : null;
          const BadgeIcon = badgeInfo?.icon || Bot;

          return (
            <div
              key={msg.id || idx}
              id={`chat-msg-${msg.id || idx}`}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`p-4 rounded-2xl max-w-2xl leading-relaxed text-xs shadow-xs transition-all ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Meta Header */}
                <div className={`flex items-center justify-between gap-3 mb-2 pb-1.5 border-b text-[11px] ${
                  isUser ? 'border-blue-500/50 text-blue-100' : 'border-slate-100 text-slate-400'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{isUser ? 'You (Fleet Administrator)' : msg.roleUsed || 'PrintPulse AI'}</span>
                    {!isUser && badgeInfo && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${badgeInfo.color}`}>
                        <BadgeIcon className="w-2.5 h-2.5" />
                        <span>{badgeInfo.label}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] opacity-80">
                    <Clock className="w-3 h-3" />
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {/* Message Content (ReactMarkdown with formatted code blocks) */}
                <div className="prose prose-sm prose-slate max-w-none break-words">
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeText = String(children).replace(/\n$/, '');
                          const codeBlockId = `code-${Math.random().toString(36).substring(2, 8)}`;
                          const isCopied = copiedCodeId === codeBlockId;

                          if (match || codeText.includes('\n')) {
                            return (
                              <div className="my-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-100 not-prose">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700 text-[11px] font-mono text-slate-300">
                                  <span>{match ? match[1].toUpperCase() : 'SHELL SCRIPT'}</span>
                                  <button
                                    onClick={() => handleCopyText(codeText, codeBlockId)}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                                  >
                                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                  </button>
                                </div>
                                <pre className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-300">
                                  <code>{children}</code>
                                </pre>
                              </div>
                            );
                          }
                          return (
                            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-blue-700 font-mono text-[11px] font-semibold border border-slate-200" {...props}>
                              {children}
                            </code>
                          );
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live Loading Thinking Bubble */}
        {isSending && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs flex items-center gap-2.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span className="font-medium text-slate-700">
                Gemini is synthesizing live telemetry across {workstations.length || 7} workstations...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips (Tailored to active role) */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Suggested:
          </span>
          {currentPersona.suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isSending}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 transition-colors whitespace-nowrap shrink-0 shadow-2xs text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            id="gemini-chat-input"
            type="text"
            placeholder={`Ask ${currentPersona.name} anything about spoolers, PowerShell scripts, toner burn rates...`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isSending}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />

          <button
            id="btn-gemini-chat-send"
            type="submit"
            disabled={!chatInput.trim() || isSending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isSending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Send</span>
          </button>
        </form>
        
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Enterprise Multi-Turn Chat powered by Google Gemini API</span>
          <span>Press Enter to send</span>
        </div>
      </div>

    </div>
  );
};
