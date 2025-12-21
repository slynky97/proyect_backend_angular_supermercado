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

    @Get('stockout-prediction')
    getStockoutPrediction(@Query('days') days: number) {
        return this.analyticsService.getStockoutPrediction(days ? Number(days) : 30);
    }
    @Get('client-analytics')
    getClientAnalytics(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('search') search: string
    ) {
        return this.analyticsService.getClientAnalytics(startDate, endDate, search);
    }

    @Get('product-history')
    getProductSalesHistory(
        @Query('productId') productId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ) {
        // Validate inputs or let service handle parsing (Service handles parsing)
        return this.analyticsService.getProductSalesHistory(Number(productId), new Date(startDate), new Date(endDate));
    }
}
