import * as crypto from 'crypto'

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('base64')
}

const key = crypto
  .createHash('sha256')
  .update('mgdlnkczmr')
  .digest('base64')
  .substring(0, 32)

export function encryptCtr(buffer: Buffer | string, _key = key) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()])
}

export function decryptCtr(encrypted: Buffer, _key = key) {
  const iv = encrypted.slice(0, 16)
  const encryptedData = encrypted.slice(16)

  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv)
  const dec = Buffer.concat([decipher.update(encryptedData), decipher.final()])
  return dec
}
