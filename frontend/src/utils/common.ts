export const smoothBezier = 'cubic-bezier(0.36, 0.07, 0.19, 0.97)'
export const zoomDelay = 100

export function waitForFontLoad(font: string, timeout = 5000, interval = 10) {
  const startTime = Date.now()

  return new Promise<boolean>((resolve, reject) => {
    const recursiveFn = () => {
      const currTime = Date.now()

      if (currTime - startTime >= timeout) {
        reject('Font listener timeout ' + font)
      } else {
        document.fonts
          .load(`1px "${font}"`)
          .then((fonts) => {
            if (fonts.length >= 1) {
              resolve(true)
            } else {
              setTimeout(recursiveFn, interval)
            }
          })
          .catch((err) => {
            reject(err)
          })
      }
    }
    recursiveFn()
  })
}
