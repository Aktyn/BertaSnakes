/* istanbul ignore file */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import sgMail from '@sendgrid/mail'
import { ErrorCode } from 'berta-snakes-shared'

interface Message {
  to: string
  subject: string
  text: string
  html: string
}

@Injectable()
export class SendgridMailer {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    }
  }

  send(msg: Message) {
    if (!process.env.SENDGRID_EMAIL_FROM) {
      Logger.error('SENDGRID_EMAIL_FROM is not defined')
      throw new InternalServerErrorException({
        error: ErrorCode.EMAIL_SENDING_ERROR,
      })
    }
    const from = {
      name: 'Berta Snakes',
      email: process.env.SENDGRID_EMAIL_FROM,
    }

    sgMail.send({ ...msg, from }).catch((err) => {
      Logger.error(err)
    })
  }
}
