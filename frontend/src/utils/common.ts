import { Config, ErrorCode } from 'berta-snakes-shared'

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

export function openImageFile(max_size = Config.MAXIMUM_IMAGE_FILE_SIZE) {
  return new Promise<string>((resolve, reject) => {
    const file_input = document.createElement('input')
    file_input.setAttribute('type', 'file')
    file_input.setAttribute('accept', 'image/*')
    file_input.onchange = (e) => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const file: File = e.target?.files[0]
        if (!file) {
          reject(ErrorCode.CANNOT_OPEN_FILE)
          return
        }

        if (file.size > max_size) {
          reject(ErrorCode.FILE_TOO_LARGE)
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          if (!e.target) {
            reject(ErrorCode.UNKNOWN)
            return
          }
          resolve(e.target.result as string)
        }
        reader.readAsDataURL(file)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        reject(ErrorCode.UNKNOWN)
      }
    }
    file_input.click()
  })
}
