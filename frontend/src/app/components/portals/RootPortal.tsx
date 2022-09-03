import { type ReactElement, useRef } from 'react'
import { createPortal } from 'react-dom'

export const RootPortal = ({ children }: { children: ReactElement }) => {
  const rootRef = useRef(document.getElementById('root'))

  if (!rootRef.current) {
    return <>{children}</>
  }
  return createPortal(children, rootRef.current)
}
