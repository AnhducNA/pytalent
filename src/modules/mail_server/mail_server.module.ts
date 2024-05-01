import { Module } from '@nestjs/common';
import { MailServerService } from './mail_server.service';
import { MailServerController } from './mail_server.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import * as process from 'process';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async () => ({
        transport: {
          host: process.env.MAIL_HOST,
          port: process.env.MAIL_PORT,
          secure: true,
          auth: {
            user: process.env.MAIL_AUTH_USER,
            pass: process.env.MAIL_AUTH_PASSWORD, // phgb cmgm gkuy djfg
          },
        },
        defaults: {
          from: '"No Reply" <pagitech@gmail.com>',
        },
      }),
    }),
  ],
  controllers: [MailServerController],
  providers: [MailServerService],
})
export class MailServerModule {}
