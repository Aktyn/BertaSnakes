import { BadRequestException } from '@nestjs/common'
import { ErrorCode } from 'berta-snakes-shared'
import type { Request as ExpressRequest } from 'express'

export function retrieveAccessToken(request: ExpressRequest) {
  const accessToken = request.headers.authorization
  if (!accessToken) {
    throw new BadRequestException({
      error: ErrorCode.NO_ACCESS_TOKEN_PROVIDED,
    })
  }
  const match = accessToken.match(/^Bearer (.*)$/)
  if (!match) {
    throw new BadRequestException({
      error: ErrorCode.INVALID_ACCESS_TOKEN,
    })
  }
  return match[1]
}
