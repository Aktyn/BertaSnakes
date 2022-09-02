import { useCallback, useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Func = (...args: any[]) => void

type ArgumentTypes<F extends Func> = F extends (...args: infer A) => void
  ? A
  : never

export function useDebounce<T extends Func>(
  func: T,
  delay = 0,
  deps?: unknown[],
) {
  const isLoaded = useRef(true)
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    isLoaded.current = true
    return () => {
      isLoaded.current = false
    }
  }, [])

  const debounce = useCallback(
    (...args: ArgumentTypes<typeof func>) => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
      timeout.current = setTimeout(() => {
        if (isLoaded.current) {
          func(...args)
        }
      }, delay)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...(deps ?? [func])],
  )

  return debounce
}
