/**
 * ============================================================
 * Chatbot Component — GeoTruth AI Assistant
 * ============================================================
 * Production-ready floating chatbot with:
 *   - Floating toggle button
 *   - ChatGPT-like card UI
 *   - Keyword-based intelligent responses
 *   - Typing indicator with delay
 *   - Auto-scroll, timestamps, animations
 *   - Quick suggestion buttons
 *   - Clear chat functionality
 *   - API-ready architecture (sendMessageToBot)
 * ============================================================
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { useEscapeKey } from '../hooks/useEscapeKey';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { chatAPI } from '../services/api.js';


// ------------------------------------------------------------------
// RESPONSE ENGINE — Keyword-based predefined responses
// ------------------------------------------------------------------

const RESPONSES = [
  {
    keywords: ['how', 'work', 'usage', 'use'],
    response:
      '🤖 GeoTruth AI analyzes news content using a multi-layered approach:\n\n' +
      '1. **AI Text Analysis** — Detects patterns typical of fake news using NLP models.\n' +
      '2. **Image Verification** — Checks image authenticity via reverse search and manipulation detection.\n' +
      '3. **News API Validation** — Cross-references claims against trusted news sources.\n' +
      '4. **Crowd Wisdom** — Aggregates community votes (Real / Fake / Misleading).\n\n' +
      'Paste any article or upload an image to get started!',
  },
  {
    keywords: ['trust score', 'trustscore', 'score'],
    response:
      '📊 The **Trust Score** (0–100%) is calculated from four weighted signals:\n\n' +
      '• **AI Analysis** (50%) — Text credibility assessment\n' +
      '• **Image Verification** (20%) — Visual content authenticity\n' +
      '• **Crowd Votes** (20%) — Community consensus\n' +
      '• **News API** (10%) — External source validation\n\n' +
      '**Labels:**\n' +
      '🟢 Real (> 70%) 🟡 Misleading (40–70%) 🔴 Fake (< 40%)',
  },
  {
    keywords: ['safe', 'data', 'privacy', 'secure', 'protection'],
    response:
      '🔒 **Your data is safe with GeoTruth AI.**\n\n' +
      '• We only use submitted content for real-time analysis.\n' +
      '• No personal data is stored permanently.\n' +
      '• Location data (if shared) is used solely for geospatial verification.\n' +
      '• All communications are encrypted in transit.\n\n' +
      'You can use GeoTruth AI without creating an account for basic checks.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: '👋 Hello! Welcome to GeoTruth AI. I can help you with fake news detection, trust scores, and usage tips. What would you like to know?',
  },
  {
    keywords: ['help', 'support', 'assist'],
    response: '💡 Try asking me:\n\n• "How does GeoTruth AI work?"\n• "What is Trust Score?"\n• "Is my data safe?"\n• "How do I analyze news?"',
  },
  {
    keywords: ['vote', 'voting', 'community'],
    response:
      '🗳️ **Community Voting**\n\n' +
      'Users can vote on analyzed news as:\n' +
      '• ✅ Real\n' +
      '• ❌ Fake\n' +
      '• ⚠️ Misleading\n\n' +
      'Votes feed into the **Crowd Score** (20% of Trust Score). ' +
      'Each user can vote once per article and change their vote anytime.',
  },
];

const DEFAULT_RESPONSE =
  "🤔 I'm not sure I understood that. Ask me about:\n\n" +
  '• How GeoTruth AI works\n' +
  '• Trust Score calculation\n' +
  '• Data privacy & safety\n' +
  '• Community voting';

/**
 * Generate a bot reply based on keyword matching.
 * @param {string} userText
 * @returns {string}
 */
function generateBotReply(userText) {
  const lower = userText.toLowerCase().trim();
  for (const entry of RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return DEFAULT_RESPONSE;
}

// ------------------------------------------------------------------
// API-READY FUNCTION — Replace with backend call later
// ------------------------------------------------------------------

/**
 * Sends a user message to the backend API and returns the bot's reply.
 * Uses /api/chat/message endpoint with auth token.
 *
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function sendMessageToBot(message, context = '') {
  try {
    const response = await chatAPI.sendMessage(message, context);
    return response.data.message;
  } catch (error) {
    console.error('Chatbot API error:', error);

    throw new Error('Failed to connect to assistant. Please try again.');
  }
}


// ------------------------------------------------------------------
// SUGGESTIONS
// ------------------------------------------------------------------

const SUGGESTIONS = [
  'How does it work?',
  'What is Trust Score?',
  'Is my data safe?',
];

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------

let globalIdCounter = 0;

function createMessage(sender, text) {
  globalIdCounter += 1;
  return {
    id: `msg-${globalIdCounter}`,
    sender,
    text,
    timestamp: new Date(),
  };
}

const Chatbot = () => {
  // ---- State ----
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    createMessage(
      'bot',
      '👋 Hi there! I am **GeoTruth Assistant**. Ask me anything about fake news detection, trust scores, or how to use the platform.'
    ),
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // ---- Refs ----
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);
  const inputRef = useRef(null);

  // ---- Auto-scroll to bottom ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  // ---- Focus input when opened ----
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ---- Close on outside click / Escape ----
  useClickOutside(chatWindowRef, useCallback(() => setIsOpen(false), []));
  useEscapeKey(useCallback(() => setIsOpen(false), []));

  // ---- Send message handler ----
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    // Add user message
    setMessages((prev) => [...prev, createMessage('user', trimmed)]);
    setInput('');
    setIsTyping(true);

    try {
      // Fetch bot reply (currently local, future: API call)
      const reply = await sendMessageToBot(trimmed);

      setMessages((prev) => [...prev, createMessage('bot', reply)]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        createMessage(
          'bot',
          '⚠️ Sorry, something went wrong. Please try again later.'
        ),
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  // ---- Enter key handler ----
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ---- Suggestion click handler ----
  const handleSuggestion = useCallback(
    async (text) => {
      if (isTyping) return;
      setMessages((prev) => [...prev, createMessage('user', text)]);
      setIsTyping(true);

      try {
        const reply = await sendMessageToBot(text);

        setMessages((prev) => [...prev, createMessage('bot', reply)]);
      } catch {
        setMessages((prev) => [
          ...prev,
          createMessage('bot', '⚠️ Sorry, something went wrong. Please try again later.'),
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping]
  );

  // ---- Clear chat ----
  const handleClear = useCallback(() => {
    setMessages([
      createMessage(
        'bot',
        '👋 Chat cleared! How can I help you today?'
      ),
    ]);
  }, []);

  // ---- Derived state ----
  const showSuggestions = messages.length <= 2 && !isTyping;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-blue-600 to-indigo-700
          hover:from-blue-700 hover:to-indigo-800
          text-white
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-out
          flex items-center justify-center
          focus:outline-none focus:ring-4 focus:ring-blue-300/50
          ${isOpen ? 'scale-90 rotate-90' : 'scale-100 hover:scale-105'}
        `}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`
          fixed bottom-24 right-6 z-50
          w-[calc(100vw-2rem)] sm:w-[28rem]
          max-h-[80vh] sm:max-h-[600px]
          bg-white rounded-2xl
          shadow-2xl border border-gray-200/80
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
        `}
        ref={chatWindowRef}
        role="dialog"
        aria-label="GeoTruth Assistant Chat"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">GeoTruth Assistant</h3>
              <p className="text-blue-100 text-[10px] opacity-90">Online • Ready to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {/* Clear chat button */}
            <button
              onClick={handleClear}
              className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Body: Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80 min-h-[200px]">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              text={msg.text}
              timestamp={msg.timestamp}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <ChatMessage
              sender="bot"
              text=""
              timestamp={new Date()}
              isTyping={true}
            />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />

          {/* Suggestion Buttons */}
          {showSuggestions && (
            <div className="pt-2 space-y-2 animate-fadeIn">
              <p className="text-[11px] text-gray-500 text-center font-medium uppercase tracking-wider">
                Quick suggestions
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleSuggestion(text)}
                    disabled={isTyping}
                    className={`
                      text-xs bg-white border border-blue-200 text-blue-700
                      px-3.5 py-2 rounded-full
                      hover:bg-blue-50 hover:border-blue-300
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all shadow-sm
                    `}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Input */}
        <ChatInput
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
      </div>
    </>
  );
};

export default Chatbot;
