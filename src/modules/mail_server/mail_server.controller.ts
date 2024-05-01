import { Controller, Get, Res } from '@nestjs/common';
import { MailServerService } from './mail_server.service';

@Controller('api/mailer')
export class MailServerController {
  constructor(private readonly mailServerService: MailServerService) {}

  @Get()
  async sendMailer(@Res() response: any) {
    const mail = await this.mailServerService.sendMail([
      'ducank961@gmail.com',
      'leanhducbigbang@gmail.com',
    ]);
    return response.status(200).json({
      message: 'success',
      mail,
    });
  }
}
