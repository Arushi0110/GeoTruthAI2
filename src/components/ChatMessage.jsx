/**
 * ============================================================
 * ChatMessage Component
 * ============================================================
 * Renders an individual chat message bubble with timestamp.
 * Supports user (right/blue) and bot (left/gray) message styles.
 * ============================================================
 */

import { memo } from 'react';

/**
 * Format a Date into a readable time string (e.g., "2:30 PM")
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * ChatMessage
 * @param {Object} props
 * @param {"user" | "bot"} props.sender
 * @param {string} props.text
 * @param {Date} props.timestamp
 * @param {boolean} [props.isTyping] — If true, shows a typing animation
 */
const ChatMessage = memo(function ChatMessage({ sender, text, timestamp, isTyping = false }) {
  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className="flex flex-col max-w-[85%]">
        {/* Message Bubble */}
        <div
          className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-md'
              : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
            }
          `}
        >
          {isTyping ? (
            <div className="flex items-center space-x-1 h-5 px-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            text
          )}
        </div>

        {/* Timestamp */}
        <span
          className={`
            text-[10px] mt-1 px-1
            ${isUser ? 'text-right text-blue-300' : 'text-left text-gray-400'}
          `}
        >
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
});

export default ChatMessage;

