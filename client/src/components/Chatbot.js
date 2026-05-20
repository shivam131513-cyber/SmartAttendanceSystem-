import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

// ── Utility: render *bold* and newlines in bot messages ─────────────────────
const FormattedMessage = ({ text }) => {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        return part.split('\n').map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ));
      })}
    </span>
  );
};

// ── Suggestion chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  '📊 How many present today?',
  '❌ Who is absent today?',
  '📚 Class 5 attendance',
  '📈 Weekly trend',
  '⏰ Late arrivals today',
  '⚠️ Chronic absentees',
  '📉 Attendance rate',
];

const Chatbot = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: `👋 Hi ${user?.username || 'there'}! I'm your **Attendance Assistant**.\n\nI can answer questions about student attendance, reports, trends, and more.\n\nTry asking me something or pick a suggestion below! 😊`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(2);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text) => {
      const msgText = (text || input).trim();
      if (!msgText) return;

      const userMsg = { id: msgIdRef.current++, from: 'user', text: msgText };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      try {
        const { data } = await axios.post('/api/chatbot', { message: msgText });
        const botMsg = { id: msgIdRef.current++, from: 'bot', text: data.reply };
        setMessages((prev) => [...prev, botMsg]);
        if (!isOpen) setHasNewMessage(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: msgIdRef.current++,
            from: 'bot',
            text: '⚠️ Sorry, I ran into an error. Please make sure the server is running and try again.',
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isOpen]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────────────────── */}
      <button
        id="chatbot-fab"
        className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Toggle attendance chatbot"
        title="Ask the attendance assistant"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {hasNewMessage && !isOpen && <span className="chatbot-badge" />}
      </button>

      {/* ── Chat Window ───────────────────────────────────────────────── */}
      <div className={`chatbot-window ${isOpen ? 'chatbot-window--open' : ''}`} role="dialog" aria-label="Attendance chatbot">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-avatar">🤖</div>
          <div className="chatbot-header-info">
            <div className="chatbot-header-name">Attendance Assistant</div>
            <div className="chatbot-header-status">
              <span className="chatbot-online-dot" />
              Online · Powered by live data
            </div>
          </div>
          <button className="chatbot-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Message area */}
        <div className="chatbot-messages" id="chatbot-messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbot-message-row ${msg.from === 'user' ? 'chatbot-message-row--user' : ''}`}>
              {msg.from === 'bot' && <div className="chatbot-avatar-mini">🤖</div>}
              <div className={`chatbot-bubble ${msg.from === 'user' ? 'chatbot-bubble--user' : 'chatbot-bubble--bot'}`}>
                <FormattedMessage text={msg.text} />
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chatbot-message-row">
              <div className="chatbot-avatar-mini">🤖</div>
              <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
                <span className="chatbot-dot" />
                <span className="chatbot-dot" />
                <span className="chatbot-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        <div className="chatbot-suggestions" id="chatbot-suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="chatbot-chip"
              onClick={() => sendMessage(s)}
              disabled={isTyping}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="chatbot-input-bar">
          <input
            ref={inputRef}
            id="chatbot-input"
            className="chatbot-input"
            type="text"
            placeholder="Ask about attendance…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            autoComplete="off"
            maxLength={200}
          />
          <button
            id="chatbot-send-btn"
            className="chatbot-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
