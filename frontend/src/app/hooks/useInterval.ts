import { useEffect, useRef } from 'react'

export function useInterval(
  func: () => void,
  delay: number,
  deps: ReadonlyArray<unknown> = [],
): null {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!delay) {
      return
    }
    func()
    intervalRef.current = setInterval(func, delay)
    return () =>
      clearInterval(intervalRef.current as ReturnType<typeof setInterval>)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...deps])

  return null
}
