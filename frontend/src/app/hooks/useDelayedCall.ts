import { useEffect } from 'react'

export function useDelayedCall(callback: () => void, delay?: number) {
  useEffect(() => {
    const timeout = setTimeout(callback, delay)

    return () => {
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
