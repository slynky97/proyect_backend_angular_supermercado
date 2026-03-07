import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { EmailController } from './email.controller';

@Global()
@Module({
    controllers: [EmailController],
    providers: [EmailService, NotificationSchedulerService],
    exports: [EmailService],
})
export class EmailModule { }


