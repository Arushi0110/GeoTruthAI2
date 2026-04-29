/**
 * ============================================================
 * ChatInput Component
 * ============================================================
 * Provides the text input field and send button for the chat.
 * Features:
 *   - Enter key support
 *   - Empty input disabling
 *   - Focus management via forwarded ref
 * ============================================================
 */

import { memo, forwardRef } from 'react';

/**
 * ChatInput
 * @param {Object} props
 * @param {string} props.value — Current input value
 * @param {Function} props.onChange — onChange handler
 * @param {Function} props.onSend — Send handler
 * @param {Function} props.onKeyDown — KeyDown handler (for Enter key)
 * @param {boolean} props.disabled — Whether input is disabled
 */
const ChatInput = memo(
  forwardRef(function ChatInput({ value, onChange, onSend, onKeyDown, disabled = false }, ref) {
    const isEmpty = !value || !value.trim();

    return (
      <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="
              flex-1 px-4 py-2.5 rounded-full
              border border-gray-300
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              text-sm outline-none
              disabled:bg-gray-100 disabled:text-gray-400
              transition-all
            "
            aria-label="Type your message"
          />
          <button
            onClick={onSend}
            disabled={isEmpty || disabled}
            className="
              p-2.5 rounded-full
              bg-blue-600 hover:bg-blue-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white
              transition-all active:scale-95
              flex items-center justify-center
            "
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  })
);

export default ChatInput;

