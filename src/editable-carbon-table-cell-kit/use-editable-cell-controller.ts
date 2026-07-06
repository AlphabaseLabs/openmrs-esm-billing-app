import { useCallback, useMemo, useState } from 'react';
import { type EditableCellController } from './types';

export function useEditableCellController<TMode extends string = string>(
  initialMode: TMode | null = null,
): EditableCellController<TMode> {
  const [mode, setMode] = useState<TMode | null>(initialMode);

  const open = useCallback((nextMode: TMode) => {
    setMode(nextMode);
  }, []);

  const close = useCallback(() => {
    setMode(null);
  }, []);

  return useMemo(
    () => ({
      close,
      isActive: mode !== null,
      mode,
      open,
      setMode,
    }),
    [close, mode, open],
  );
}
