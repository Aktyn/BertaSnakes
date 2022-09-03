import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import type { User } from '@prisma/client'
import {
  Config,
  ErrorCode,
  getRandomString,
  pick,
  Repeatable,
} from 'berta-snakes-shared'

import { sha256 } from '../../common/crypto'
import { PrismaService } from '../../db/prisma.service'

interface SessionSchema {
  userId: User['id']
  role: User['role']
  accessToken: string
  expiresTimestamp: number
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)
  private readonly sessions = new Map<string, SessionSchema>()

  constructor(private prisma: PrismaService) {
    const now = Date.now()

    this.removeExpired()
      .then(() =>
        this.prisma.session.findMany({
          where: {
            expiresTimestamp: {
              gt: now,
            },
          },
          include: {
            user: {
              select: {
                role: true,
              },
            },
          },
        }),
      )
      .then((sessions) => {
        this.logger.log(`Loaded ${sessions.length} sessions`)

        for (const session of sessions) {
          this.sessions.set(session.accessToken, {
            ...pick(session, 'accessToken', 'userId'),
            expiresTimestamp: Number(session.expiresTimestamp),
            role: session.user.role,
          })
        }
      })
      .catch(this.logger.error)

    // Remove expired sessions every hour
    new Repeatable(() => this.removeExpired().catch(this.logger.error), {
      runImmediately: false,
      frequency: 1000 * 60 * 60,
    })

    this.logger.log('Session service initialized')
  }

  private removeExpired() {
    const now = Date.now()

    for (const [key, session] of this.sessions) {
      if (session.expiresTimestamp <= now) {
        this.sessions.delete(key)
      }
    }

    return this.prisma.session
      .deleteMany({
        where: {
          expiresTimestamp: {
            lte: now,
          },
        },
      })
      .then((res) => {
        this.logger.log(`Removed ${res.count} expired sessions`)
        return res.count
      })
  }

  getSession(accessToken: string) {
    const session = this.sessions.get(accessToken)
    if (!session || session.expiresTimestamp <= Date.now()) {
      if (session) {
        // Remove expired session
        this.sessions.delete(accessToken)
      }
      throw new UnauthorizedException({
        error: ErrorCode.SESSION_NOT_FOUND,
      })
    }

    return session
  }

  createSession(userData: Pick<User, 'id' | 'role'>) {
    const accessToken = sha256(getRandomString(32))
    const expiresTimestamp = Date.now() + Config.LOGIN_SESSION_LIFETIME

    const session: SessionSchema = {
      userId: userData.id,
      role: userData.role,
      accessToken,
      expiresTimestamp,
    }
    this.sessions.set(accessToken, session)

    this.prisma.session
      .create({
        data: {
          userId: session.userId,
          accessToken,
          expiresTimestamp,
        },
      })
      .catch(this.logger.error)

    return session
  }
}
