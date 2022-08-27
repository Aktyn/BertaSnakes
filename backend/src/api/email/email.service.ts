import { Injectable } from '@nestjs/common'

import { HtmlRendererService } from './html-renderer.service'
import { SendgridMailer } from './sendgrid-mailer'

interface SendEmail {
  to: string
  code: string
  firstName: string
}

@Injectable()
export class EmailService {
  constructor(
    // private apiConfigService: ApiConfigService,
    private htmlRendererService: HtmlRendererService,
    private sendgridMailer: SendgridMailer,
  ) {}

  // async sendSetPasswordEmail({ to, token, firstName }: SendEmail) {
  //   const url = `${this.apiConfigService.adminpanelBaseUrl}/reset-password?token=${token}`

  //   const msgHtml = await this.htmlRendererService.renderSetPasswordEmail(
  //     url,
  //     firstName,
  //   )

  //   const msg = {
  //     to,
  //     subject: 'Set new password',
  //     text: `Your account has been created successfully. To set new password click on the link: ${url}`,
  //     html: msgHtml,
  //   }

  //   this.sendgridMailer.send(msg)
  // }

  // async sendLostPasswordEmail({ to, token, firstName }: SendEmail) {
  //   const url = `${this.apiConfigService.frontendBaseUrl}/reset-password?token=${token}`

  //   const msgHtml = await this.htmlRendererService.renderLostPasswordEmail(
  //     url,
  //     firstName,
  //   )

  //   const msg = {
  //     to,
  //     subject: 'Password reset',
  //     text: `To reset your password click on the link: ${url}`,
  //     html: msgHtml,
  //   }

  //   this.sendgridMailer.send(msg)
  // }

  async sendConfirmationEmail({ to, code, firstName }: SendEmail) {
    const url = `${process.env.FRONTEND_BASE_URL}/web/confirm-email?code=${code}`

    const msgHtml = await this.htmlRendererService.renderConfirmationEmail(
      url,
      firstName,
    )

    const msg = {
      to,
      subject: 'Confirmation email',
      text: `To confirm your email click on the link: ${url}`,
      html: msgHtml,
    }

    this.sendgridMailer.send(msg)
  }

  // sendSupportRequestEmail(msg: {
  //   replyTo: string
  //   subject: string
  //   text: string
  //   html: string
  // }) {
  //   const to = this.apiConfigService.supportEmailAddress
  //   this.sendgridMailer.send({ ...msg, to })
  // }
}
