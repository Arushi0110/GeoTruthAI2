import { useEffect } from 'react';

/**
 * useEscapeKey hook
 * Triggers a callback when the Escape key is pressed.
 * Used for closing modals, chat windows, etc.
 */
export const useEscapeKey = (callback) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback]);
};

export default useEscapeKey;

