import { Controller, Post, Body, Query } from '@nestjs/common';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Controller('email')
export class EmailController {
    constructor(private readonly notificationScheduler: NotificationSchedulerService) { }

    @Post('daily-summary')
    async sendDailySummary(@Body('date') date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        // If date is provided (e.g. from client), use it. Defaults to today.
        // If user wants "Yesterday", client should send yesterday's date.
        return await this.notificationScheduler.processDailySummary(targetDate);
    }
}
