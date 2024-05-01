import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailServerService {
  constructor(private readonly mailService: MailerService) {}

  async sendMail(emailList: any[]) {
    const url = 'https://ethereal.email/create';
    const message = `Hệ thống đánh giá năng lực ứng viên bao gồm các trò chơi đánh giá`;
    await this.mailService
      .sendMail({
        from: 'paditech@gmail.com',
        to: emailList,
        subject: `Bạn được mời vào làm bài test đánh giá năng lực.`,
        text: message,
        context: {
          name: 'duc',
          url,
        },
      })
      .then(() => {
        console.log(`Email sent to ${emailList}`);
      })
      .catch((e) => {
        console.log('Error sending email', e);
      });
  }
}
