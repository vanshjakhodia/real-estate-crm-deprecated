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
      text: `Welcome. I am your Gemini Estate Intelligence Assistant for Lineage Properties Pvt Ltd. I can answer inquiries regarding your registered client dossiers, active estate portfolio, scheduled walkthroughs and real-time Kanpur market intelligence. How may I assist you today?`,
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
      const firstProperty = properties[0];
      const secondProperty = properties[1];
      if (firstProperty) prompts.push(`What are the registered details for ${firstProperty.project_name}?`);
      if (secondProperty) {
        prompts.push(`Check pricing and status for ${secondProperty.project_name}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
      <div className="flex h-[620px] w-full max-w-2xl flex-col rounded-xl bg-card shadow-2xl overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-sidebar px-6 py-4 text-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary border border-border">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-foreground">Gemini Estate Intelligence</h3>
              <p className="text-xs text-muted-foreground">
                Connected to real registry database • Language: English
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs text-primary hover:text-foreground hover:bg-card transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-background">
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
                    ? 'bg-secondary text-primary border border-border'
                    : 'bg-secondary text-forest border border-border'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-secondary text-foreground border border-border'
                    : 'bg-card text-secondary-foreground border border-border'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`mt-1.5 text-[10px] text-right font-mono ${
                    msg.sender === 'user' ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-primary py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="font-mono text-[11px]">Gemini is analyzing Kanpur CRM records...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="border-t border-border bg-sidebar p-3 overflow-x-auto">
          <div className="flex gap-2 text-[11px] whitespace-nowrap">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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
          className="flex items-center gap-2 border-t border-border bg-sidebar p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Inquire regarding Kanpur leads, scheduled visits, or estate valuations..."
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary hover:bg-primary text-primary-foreground disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
