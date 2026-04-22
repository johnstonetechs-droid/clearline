import { useCallback, useState } from 'react';

export interface ToggleSetApi<T> {
  values: ReadonlySet<T>;
  has: (value: T) => boolean;
  toggle: (value: T) => void;
  clear: () => void;
  size: number;
}

/**
 * React state helper for a Set-of-T filter: toggle membership, clear all, read
 * current state. Used for damage-type, service-type, and org filter chips.
 */
export function useToggleSet<T>(initial?: Iterable<T>): ToggleSetApi<T> {
  const [values, setValues] = useState<Set<T>>(() => new Set(initial ?? []));

  const toggle = useCallback((value: T) => {
    setValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  const clear = useCallback(() => setValues(new Set()), []);

  return {
    values,
    has: (value: T) => values.has(value),
    toggle,
    clear,
    size: values.size,
  };
}
