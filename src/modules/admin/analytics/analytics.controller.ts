import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('summary')
    getSummary(@Query('period') period: string) {
        return this.analyticsService.getSummary(period);
    }

    @Get('sales-trend')
    getSalesTrend(
        @Query('period') period: string,
        @Query('granularity') granularity: 'day' | 'week' | 'month'
    ) {
        return this.analyticsService.getSalesTrend(period, granularity);
    }

    @Get('sales-comparison')
    getSalesComparison() {
        return this.analyticsService.getSalesComparison();
    }

    @Get('top-products')
    getTopProducts(@Query('period') period: string) {
        return this.analyticsService.getTopProducts(period);
    }

    @Get('sales-by-category')
    getSalesByCategory(@Query('period') period: string) {
        return this.analyticsService.getSalesByCategory(period);
    }

    @Get('most-profitable')
    getMostProfitable(@Query('period') period: string) {
        return this.analyticsService.getMostProfitableProducts(period);
    }

    @Get('dead-stock')
    getDeadStock(@Query('days') days: number) {
        return this.analyticsService.getDeadStock(days);
    }

    @Get('top-products-by-range')
    getTopProductsByRange(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ) {
        return this.analyticsService.getTopProductsByDateRange(startDate, endDate);
    }

}
