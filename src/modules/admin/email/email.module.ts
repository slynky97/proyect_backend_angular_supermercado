import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

import { NotificationSchedulerService } from './notification-scheduler.service';

@Global()
@Module({
    providers: [EmailService, NotificationSchedulerService],
    exports: [EmailService],
})
export class EmailModule { }
