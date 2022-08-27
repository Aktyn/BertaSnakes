import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import type { Prisma, User } from '@prisma/client'
import type {
  PaginatedResponse,
  SearchUserRequest,
  UserPrivate,
  UserPublic,
} from 'berta-snakes-shared'
import { omit, getRandomString, ErrorCode } from 'berta-snakes-shared'

import { sha256 } from '../../common/crypto'
import { PrismaService } from '../../db/prisma.service'
import { EmailService } from '../email/email.service'

import type { CreateUserDto } from './user.dto'

const parseToUserPublic = (data: {
  [key in keyof UserPublic]: User[key]
}): UserPublic => ({ ...data, created: Number(data.created) })

const parseToUserPrivate = (
  data: { [key in keyof UserPrivate]: User[key] },
  confirmed: boolean,
): UserPrivate => ({
  ...omit(data, 'confirmed'),
  created: Number(data.created),
  confirmed,
})

const selectPrivate: { [key in keyof UserPrivate]: true } = {
  id: true,
  name: true,
  email: true,
  created: true,
  confirmed: true,
}

const selectPublic: { [key in keyof UserPublic]: true } = {
  id: true,
  name: true,
  created: true,
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
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
    )
    await this.emailService.sendConfirmationEmail({
      to: createdUser.email,
      firstName: createdUser.name,
      code: emailConfirmationHash,
    })

    return parseToUserPrivate(createdUser, false)
  }

  async confirmEmail(confirmationCode: string): Promise<UserPrivate> {
    if (!confirmationCode) {
      throw new BadRequestException({
        error: ErrorCode.INVALID_ERROR_CONFIRMATION_CODE,
      })
    }

    try {
      //TODO: auto login user and return generated access token
      let user = await this.prisma.user.findFirst({
        where: {
          confirmed: { equals: confirmationCode, mode: 'default' },
        },
        select: selectPrivate,
      })

      if (!user) {
        throw new Error('User not found with corresponding confirmation code')
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

      return parseToUserPrivate(user, true)
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException({
        error: ErrorCode.INVALID_ERROR_CONFIRMATION_CODE,
      })
    }
  }
}
