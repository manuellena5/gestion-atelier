import { useRef } from 'react';

const LONG_PRESS_MS = 2000;

interface LongPressHandlers {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
}

export function useLongPress(onLongPress: () => void): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start(): void {
    timerRef.current = setTimeout(onLongPress, LONG_PRESS_MS);
  }

  function clear(): void {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
}
