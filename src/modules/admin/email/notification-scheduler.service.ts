import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { Nota } from '../nota/entities/nota.entity';

@Injectable()
export class NotificationSchedulerService {
    constructor(
        private readonly emailService: EmailService,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async processDailySummary(date: Date) {
        console.log(`Processing daily sales summary for ${date.toISOString()}...`);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`Querying sales from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        const sales = await this.dataSource
            .getRepository(Nota)
            .find({
                where: {
                    fecha: Between(startOfDay, endOfDay),
                    tipo_nota: 'venta',
                },
                relations: ['movimientos', 'movimientos.producto', 'user'],
                order: {
                    fecha: 'DESC' // Show latest sales first
                }
            });

        console.log(`Found ${sales.length} sales for ${startOfDay.toLocaleDateString()}.`);

        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_calculado), 0);
        const totalSales = sales.length;

        if (totalSales > 0) {
            await this.emailService.sendDailySummary(totalRevenue, totalSales, sales);
            return { success: true, count: totalSales, revenue: totalRevenue, message: 'Email sent' };
        } else {
            console.log('No sales found for this date, skipping email.');
            return { success: false, count: 0, message: 'No sales found' };
        }
    }

    @Cron('59 23 * * *') // Run at 11:59 PM every day
    async handleDailySummary() {
        await this.processDailySummary(new Date());
    }
}
