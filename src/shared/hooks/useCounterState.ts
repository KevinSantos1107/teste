import { useRef, useState, useCallback } from 'react';

/**
 * Hook para um valor numérico que pode ser atualizado via callback estável.
 * Usa useRef internamente para evitar closures obsoletas durante animações.
 */
export function useCounterState(initial: number) {
  const [value, setValueState] = useState(initial);
  const valueRef = useRef(initial);

  const setValue = useCallback((v: number) => {
    valueRef.current = v;
    setValueState(v);
  }, []);

  return { value, setValue };
}
