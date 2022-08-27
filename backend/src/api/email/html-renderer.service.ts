import { readFile } from 'fs/promises'
import path from 'path'

import { Injectable } from '@nestjs/common'
import handlebars from 'handlebars'

interface RenderEmailTemplate {
  url: string
  fname: string
  [k: string]: string
}

@Injectable()
export class HtmlRendererService {
  // async renderLostPasswordEmail(url: string, firstName: string) {
  //   return await this.renderEmailTemplate({
  //     url,
  //     fname: 'lost-password',
  //     firstName,
  //   })
  // }

  async renderConfirmationEmail(url: string, firstName: string) {
    return await this.renderEmailTemplate({
      url,
      fname: 'confirm-email',
      firstName,
    })
  }

  // async renderSetPasswordEmail(url: string, firstName: string) {
  //   return await this.renderEmailTemplate({
  //     url,
  //     fname: 'set-password',
  //     firstName,
  //   })
  // }

  private async renderEmailTemplate({
    url,
    fname,
    ...args
  }: RenderEmailTemplate) {
    const msgHtml = await readFile(
      path.join(__dirname, `./templates/${fname}.hbs`),
      'utf-8',
    )
    const msgTemplate = handlebars.compile(msgHtml)
    return msgTemplate({ url, ...args })
  }
}
