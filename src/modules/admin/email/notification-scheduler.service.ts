import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Nota } from '../nota/entities/nota.entity';

@Injectable()
export class NotificationSchedulerService {
    constructor(
        private readonly emailService: EmailService,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    @Cron('0 0 * * *') // Run at midnight every day
    async handleDailySummary() {
        console.log('Running daily sales summary...');
        const today = new Date();
        // We want the summary of the *previous* day since it runs at midnight (start of new day)
        // Or we can run it at 23:59.
        // If running at 00:00, we should look at "yesterday".
        // Let's look at the previous 24 hours.

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const result = await this.dataSource
            .getRepository(Nota)
            .createQueryBuilder('nota')
            .where('nota.fecha >= :start', { start: yesterday })
            .andWhere('nota.fecha < :end', { end: todayStart })
            .andWhere('nota.tipo_nota = :tipo', { tipo: 'venta' })
            .select('SUM(nota.total_calculado)', 'totalRevenue')
            .addSelect('COUNT(nota.id)', 'totalSales')
            .getRawOne();

        const totalRevenue = parseFloat(result.totalRevenue || '0');
        const totalSales = parseInt(result.totalSales || '0', 10);

        if (totalSales > 0) {
            await this.emailService.sendDailySummary(totalRevenue, totalSales);
        }
    }
}
