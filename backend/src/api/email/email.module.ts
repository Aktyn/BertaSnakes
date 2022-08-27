import { Module } from '@nestjs/common'

import { EmailService } from './email.service'
import { HtmlRendererService } from './html-renderer.service'
import { SendgridMailer } from './sendgrid-mailer'

@Module({
  imports: [],
  providers: [EmailService, HtmlRendererService, SendgridMailer],
  exports: [EmailService],
})
export class EmailModule {}
