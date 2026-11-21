import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import { Sparkles, X, Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { askAiAssistant, settings, properties, leads, appointments } = useCrm();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Welcome. I am your Gemini Estate Intelligence Assistant for Lineage Properties Pvt Ltd. I can answer inquiries regarding your registered client dossiers, active estate portfolio, scheduled walkthroughs, and real-time Kanpur market intelligence. How may I assist you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic quick prompts strictly derived from real admin database & verified market data
  const quickPrompts = React.useMemo(() => {
    const prompts: string[] = [];

    // Real property queries if admin has added properties
    if (properties.length > 0) {
      prompts.push(`What are the registered details for ${properties[0].project_name}?`);
      if (properties.length > 1) {
        prompts.push(`Check pricing and status for ${properties[1].project_name}`);
      }
    } else {
      prompts.push('What is our current portfolio status?');
    }

    // Real client queries if admin has registered clients
    if (leads.length > 0) {
      const hot = leads.find((l) => l.lead_score === 'hot');
      if (hot) {
        prompts.push(`Summarize requirements for ${hot.full_name}`);
      } else {
        prompts.push('Show clients requiring follow-up');
      }
    } else {
      prompts.push('How do I register a new client or import Excel data?');
    }

    // Real appointment queries if walkthroughs are booked
    if (appointments.some((a) => a.status === 'booked')) {
      prompts.push('Show upcoming confirmed site walkthroughs');
    } else {
      prompts.push('What are the latest property rates across Kanpur?');
    }

    // Real infrastructure & market query
    prompts.push('Show Kanpur Metro & infrastructure status');

    return prompts.slice(0, 4);
  }, [properties, leads, appointments]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAiAssistant(textToSend.trim());
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Error connecting to Gemini AI: ${err.message || 'Please check Edge Function or network.'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
      <div className="flex h-[620px] w-full max-w-2xl flex-col rounded-xl bg-[#181613] shadow-2xl overflow-hidden border border-[#383126]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2C2720] bg-[#161411] px-6 py-4 text-[#EAE5D9]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221F1A] text-[#C2A675] border border-[#383126]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#F4EFE6]">Gemini Estate Intelligence</h3>
              <p className="text-xs text-[#8C8477]">
                Connected to real registry database • Language: English
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-[#3E362A] bg-[#221F1A] px-2.5 py-1 text-xs text-[#C2A675] hover:text-[#F4EFE6] hover:bg-[#2C2720] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8C8477] hover:bg-[#201D18] hover:text-[#EAE5D9] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#12110E]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-serif ${
                  msg.sender === 'user'
                    ? 'bg-[#262118] text-[#C2A675] border border-[#3E362A]'
                    : 'bg-[#1C1A16] text-[#9DBFA5] border border-[#2E2820]'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#25211B] text-[#F4EFE6] border border-[#3E362A]'
                    : 'bg-[#181613] text-[#D5CEBF] border border-[#2E2820]'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`mt-1.5 text-[10px] text-right font-mono ${
                    msg.sender === 'user' ? 'text-[#8C8477]' : 'text-[#736B5F]'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#C2A675] py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C2A675]" />
              <span className="font-mono text-[11px]">Gemini is analyzing Kanpur CRM records...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="border-t border-[#26221B] bg-[#161411] p-3 overflow-x-auto">
          <div className="flex gap-2 text-[11px] whitespace-nowrap">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="rounded-lg border border-[#332D24] bg-[#1B1916] px-3 py-1.5 text-[#A8A194] hover:border-[#C2A675] hover:text-[#C2A675] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 border-t border-[#2C2720] bg-[#161411] p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Inquire regarding Kanpur leads, scheduled visits, or estate valuations..."
            className="flex-1 rounded-lg border border-[#332D24] bg-[#11100E] px-4 py-2.5 text-xs text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C2A675] hover:bg-[#B39562] text-[#11100E] disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
