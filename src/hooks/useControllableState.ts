import { useCallback, useState } from "react";

interface ControllableStateOptions<T> {
  readonly value: T | undefined;
  readonly defaultValue: T;
  readonly onChange: ((value: T) => void) | undefined;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): readonly [T, (nextValue: T) => void] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const setValue = useCallback(
    (nextValue: T) => {
      if (Object.is(nextValue, currentValue)) return;
      if (value === undefined) setInternalValue(nextValue);
      onChange?.(nextValue);
    },
    [currentValue, onChange, value],
  );

  return [currentValue, setValue] as const;
}
