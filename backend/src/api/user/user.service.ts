import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma, User } from '@prisma/client'
import type {
  PaginatedResponse,
  SearchUserRequest,
  UserPrivate,
  UserPublic,
  UserRole,
  UserSessionData,
} from 'berta-snakes-shared'
import { pick, getRandomString, ErrorCode } from 'berta-snakes-shared'

import { sha256 } from '../../common/crypto'
import { PrismaService } from '../../db/prisma.service'
import { EmailService } from '../email/email.service'

import { SessionService } from './session.service'
import type { CreateUserDto, LoginUserDto } from './user.dto'

const parseToUserPublic = (data: {
  [key in keyof UserPublic]: User[key]
}): UserPublic => ({
  ...pick(data, 'id', 'name'),
  created: Number(data.created),
  lastLogin: Number(data.lastLogin),
  role: data.role as UserRole,
})

const parseToUserPrivate = (data: {
  [key in keyof UserPrivate]: User[key]
}): UserPrivate => ({
  ...parseToUserPublic(data),
  email: data.email,
  confirmed: !data.confirmed,
})

const selectPublic: { [key in keyof UserPublic]: true } = {
  id: true,
  name: true,
  created: true,
  lastLogin: true,
  role: true,
}

const selectPrivate: { [key in keyof UserPrivate]: true } = {
  ...selectPublic,
  email: true,
  confirmed: true,
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private sessionService: SessionService,
  ) {}

  async findAll(
    page: number,
    pageSize: number,
    searchParameters: SearchUserRequest,
  ): Promise<PaginatedResponse<UserPublic>> {
    const conditions: Prisma.UserWhereInput = {
      AND: [
        {
          name: searchParameters.name
            ? { equals: searchParameters.name, mode: 'insensitive' }
            : searchParameters.nameFragment
            ? {
                contains: searchParameters.nameFragment,
                mode: 'insensitive',
              }
            : undefined,
        },
        {
          email: searchParameters.email
            ? { equals: searchParameters.email, mode: 'insensitive' }
            : searchParameters.emailFragment
            ? {
                contains: searchParameters.emailFragment,
                mode: 'insensitive',
              }
            : undefined,
        },
      ],
    }

    const results = await this.prisma.$transaction([
      this.prisma.user.count({ where: conditions }),
      this.prisma.user.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: conditions,
        //orderBy, //TODO: sorting options
        select: selectPublic,
      }),
    ])

    if (results.length !== 2) {
      throw new InternalServerErrorException({
        error: ErrorCode.DATABASE_SEARCH_ERROR,
      })
    }

    return {
      items: results[1].map(parseToUserPublic),
      page,
      pageSize,
      total: results[0],
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<UserSessionData> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              equals: loginUserDto.usernameOrEmail,
              mode: 'insensitive',
            },
          },
          {
            email: {
              equals: loginUserDto.usernameOrEmail,
              mode: 'insensitive',
            },
          },
        ],
      },
    })

    if (!users.length) {
      throw new NotFoundException({
        error: ErrorCode.USERNAME_OR_EMAIL_DOES_NOT_EXIST,
      })
    }

    const authorizedUsers = users.filter((user) => {
      const password = sha256(loginUserDto.password + user.salt)
      return password === user.password
    })

    if (!authorizedUsers.length) {
      throw new BadRequestException({
        error: ErrorCode.INCORRECT_PASSWORD,
      })
    }

    const loggedUser = await this.prisma.user.update({
      data: {
        lastLogin: Date.now(),
      },
      where: {
        id: authorizedUsers[0].id,
      },
      select: selectPrivate,
    })

    const session = this.sessionService.createSession(loggedUser)
    this.logger.log(
      `User logged in: ${loggedUser.name}, id: ${loggedUser.id}`,
      'REST API',
    )
    return {
      user: parseToUserPrivate(loggedUser),
      accessToken: session.accessToken,
      expires: session.expiresTimestamp,
    }
  }

  async getSelfUser(accessToken: string): Promise<UserPrivate> {
    const session = this.sessionService.getSession(accessToken)

    if (!session) {
      throw new NotFoundException({
        error: ErrorCode.SESSION_NOT_FOUND,
      })
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: selectPrivate,
    })

    if (!user) {
      throw new NotFoundException({
        error: ErrorCode.USER_NOT_FOUND,
      })
    }
    return parseToUserPrivate(user)
  }

  async create(createUserDto: CreateUserDto): Promise<UserPrivate> {
    //? if (!this.authService.checkPassword(user.password)) {
    //?   throw new BadRequestException(
    //?     'Password must contain uppercase, lowercase, digit and special sign',
    //?   )
    //? }

    if (
      await this.findAll(0, 1, { email: createUserDto.email }).then(
        (result) => result.total,
      )
    ) {
      throw new BadRequestException({
        error: ErrorCode.EMAIL_ALREADY_EXISTS,
      })
    }
    if (
      await this.findAll(0, 1, { name: createUserDto.name }).then(
        (result) => result.total,
      )
    ) {
      throw new BadRequestException({
        error: ErrorCode.USERNAME_ALREADY_EXISTS,
      })
    }

    const emailConfirmationHash = sha256(getRandomString(32))
    const salt = getRandomString(16)
    const password = sha256(createUserDto.password + salt)

    const data: Prisma.UserCreateInput = {
      ...createUserDto,
      created: Date.now(),
      lastLogin: 0,
      salt,
      password,
      confirmed: emailConfirmationHash,
    }

    const createdUser = await this.prisma.user.create({
      data,
      select: selectPrivate,
    })
    this.logger.log(
      `New user created {id: ${createdUser.id}; name: ${createdUser.name}}`,
      'REST API',
    )
    await this.emailService.sendConfirmationEmail({
      to: createdUser.email,
      firstName: createdUser.name,
      code: emailConfirmationHash,
    })

    return parseToUserPrivate(createdUser)
  }

  async confirmEmail(confirmationCode: string): Promise<UserSessionData> {
    if (!confirmationCode) {
      throw new BadRequestException({
        error: ErrorCode.INVALID_ERROR_CONFIRMATION_CODE,
      })
    }

    try {
      let user = await this.prisma.user.findFirst({
        where: {
          confirmed: { equals: confirmationCode, mode: 'default' },
        },
        select: selectPrivate,
      })

      if (!user) {
        throw new Error(
          `User not found with corresponding confirmation code: ${confirmationCode}`,
        )
      }

      user = await this.prisma.user.update({
        data: {
          confirmed: null,
        },
        where: {
          id: user.id,
        },
        select: selectPrivate,
      })

      const session = this.sessionService.createSession(user)
      this.logger.log(
        `User confirmed email: ${user.name}, id: ${user.id}`,
        'REST API',
      )
      return {
        user: parseToUserPrivate(user),
        accessToken: session.accessToken,
        expires: session.expiresTimestamp,
      }
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException({
        error: ErrorCode.INVALID_ERROR_CONFIRMATION_CODE,
      })
    }
  }
}
