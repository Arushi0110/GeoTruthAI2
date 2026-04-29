import { useEffect } from 'react';

/**
 * useClickOutside hook
 * Detects clicks outside a referenced element and triggers a callback.
 * Used for closing modals, dropdowns, chat windows, etc.
 */
export const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, callback]);
};

export default useClickOutside;

