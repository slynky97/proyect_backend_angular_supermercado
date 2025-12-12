import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, Not } from 'typeorm';
import { Nota } from '../nota/entities/nota.entity';
import { Movimiento } from '../nota/entities/movimiento.entity';
import { AlmacenProducto } from '../inventario/almacen/entities/almacen_producto.entity';
import { startOfDay, subDays, endOfDay, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Nota)
        private notaRepository: Repository<Nota>,
        @InjectRepository(Movimiento)
        private movimientoRepository: Repository<Movimiento>,
        @InjectRepository(AlmacenProducto)
        private almacenProductoRepository: Repository<AlmacenProducto>,
    ) { }

    private getDateRange(period: string = '7d'): { start: Date, end: Date, groupBy: 'day' | 'month' } {
        const end = endOfDay(new Date());
        let start = startOfDay(new Date());
        let groupBy: 'day' | 'month' = 'day';

        switch (period) {
            case 'today':
                start = startOfDay(new Date());
                break;
            case '7d':
                start = subDays(end, 7);
                break;
            case '30d':
                start = subDays(end, 30);
                break;
            case '1y':
                start = subDays(end, 365);
                groupBy = 'month';
                break;
            default:
                start = subDays(end, 7);
        }

        return { start, end, groupBy };
    }

    async getSummary(period: string) {
        const { start, end } = this.getDateRange(period);

        // Total Sales
        const totalSalesResult = await this.notaRepository
            .createQueryBuilder('nota')
            .select('SUM(nota.total_calculado)', 'total')
            .where('nota.estado_nota != :estado', { estado: 'ANULADA' })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start, end })
            .getRawOne();

        const totalSales = parseFloat(totalSalesResult.total) || 0;

        // Total Orders
        const totalOrders = await this.notaRepository.count({
            where: {
                estado_nota: Not('ANULADA'),
                fecha: Between(start, end)
            }
        });

        // Average Ticket
        const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Low Stock Products (Always current snapshot)
        const lowStockCount = await this.almacenProductoRepository.count({
            where: { cantidad_actual: LessThan(10) }
        });

        // Out of Stock (0 quantity)
        const outOfStockCount = await this.almacenProductoRepository.count({
            where: { cantidad_actual: 0 }
        });

        // Critical Stock (<= 10 quantity)
        const criticalStockCount = await this.almacenProductoRepository.count({
            where: { cantidad_actual: LessThan(11) } // LessThan 11 means <= 10
        });

        // Clients Served (Distinct clients)
        const clientsServedResult = await this.notaRepository
            .createQueryBuilder('nota')
            .select('COUNT(DISTINCT nota.clienteId)', 'count')
            .where('nota.estado_nota != :estado', { estado: 'ANULADA' })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start, end })
            .getRawOne();

        const clientsServed = parseInt(clientsServedResult.count, 10) || 0;

        return {
            totalSales,
            totalOrders,
            averageTicket,
            lowStockCount,
            outOfStockCount,
            criticalStockCount,
            clientsServed
        };
    }

    async getSalesTrend(period: string, granularity: 'day' | 'week' | 'month' = 'day') {
        const { start, end } = this.getDateRange(period);

        let intervals: Date[];
        let formatStr: string;

        if (granularity === 'month') {
            intervals = eachMonthOfInterval({ start, end });
            formatStr = 'MMM yyyy';
        } else if (granularity === 'week') {
            intervals = eachWeekOfInterval({ start, end });
            formatStr = "'Sem' w";
        } else {
            intervals = eachDayOfInterval({ start, end });
            formatStr = 'EEE dd';
        }

        const salesData: number[] = [];
        const labels: string[] = [];

        for (const date of intervals) {
            labels.push(format(date, formatStr));

            let sliceStart: Date, sliceEnd: Date;

            if (granularity === 'month') {
                sliceStart = startOfMonth(date);
                sliceEnd = endOfMonth(date);
            } else if (granularity === 'week') {
                sliceStart = startOfWeek(date, { weekStartsOn: 1 });
                sliceEnd = endOfWeek(date, { weekStartsOn: 1 });
            } else {
                sliceStart = startOfDay(date);
                sliceEnd = endOfDay(date);
            }

            const total = await this.notaRepository
                .createQueryBuilder('nota')
                .select('SUM(nota.total_calculado)', 'total')
                .where('nota.fecha BETWEEN :sliceStart AND :sliceEnd', { sliceStart, sliceEnd })
                .andWhere('nota.estado_nota != :estado', { estado: 'ANULADA' })
                .getRawOne();

            salesData.push(parseFloat(total.total) || 0);
        }

        return { labels, data: salesData };
    }

    async getSalesComparison() {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfDay(now);

        const prevMonthStart = startOfMonth(subMonths(now, 1));
        const prevMonthEnd = endOfMonth(subMonths(now, 1));

        // Helper to get sales for a range
        const getSales = async (start: Date, end: Date) => {
            const result = await this.notaRepository
                .createQueryBuilder('nota')
                .select('SUM(nota.total_calculado)', 'total')
                .where('nota.fecha BETWEEN :start AND :end', { start, end })
                .andWhere('nota.estado_nota != :estado', { estado: 'ANULADA' })
                .getRawOne();
            return parseFloat(result.total) || 0;
        };

        const currentMonthSales = await getSales(currentMonthStart, currentMonthEnd);
        const prevMonthSales = await getSales(prevMonthStart, prevMonthEnd);

        return {
            labels: ['Mes Anterior', 'Mes Actual'],
            data: [prevMonthSales, currentMonthSales]
        };
    }

    async getTopProducts(period: string) {
        const { start, end } = this.getDateRange(period);
        console.log('getTopProducts called with period:', period, 'start:', start, 'end:', end);

        const topProducts = await this.movimientoRepository
            .createQueryBuilder('movimiento')
            .leftJoinAndSelect('movimiento.producto', 'producto')
            .leftJoin('movimiento.nota', 'nota')
            .select('producto.nombre', 'name')
            .addSelect('SUM(movimiento.cantidad)', 'total_sold')
            .where('movimiento.tipo_movimiento = :type', { type: 'salida' })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start, end })
            .andWhere('nota.estado_nota != :estado', { estado: 'ANULADA' })
            .groupBy('producto.id')
            .addGroupBy('producto.nombre')
            .orderBy('total_sold', 'DESC')
            .limit(10)
            .getRawMany();

        console.log('getTopProducts result count:', topProducts.length);
        if (topProducts.length === 0) {
            // Debug: check if any movements exist at all for this period
            const count = await this.movimientoRepository.count({
                where: { tipo_movimiento: 'salida' }
            });
            console.log('Total "salida" movements in DB (any date):', count);
        }

        return {
            labels: topProducts.map(p => p.name),
            data: topProducts.map(p => parseInt(p.total_sold, 10))
        };
    }

    async getSalesByCategory(period: string) {
        const { start, end } = this.getDateRange(period);

        const categorySales = await this.movimientoRepository
            .createQueryBuilder('movimiento')
            .leftJoin('movimiento.producto', 'producto')
            .leftJoin('producto.categoria', 'categoria')
            .leftJoin('movimiento.nota', 'nota')
            .select('categoria.nombre', 'category')
            .addSelect('SUM(movimiento.total_calculado)', 'total_sales')
            .where('movimiento.tipo_movimiento = :type', { type: 'salida' })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start, end })
            .andWhere('nota.estado_nota != :estado', { estado: 'ANULADA' })
            .groupBy('categoria.id')
            .addGroupBy('categoria.nombre')
            .orderBy('total_sales', 'DESC')
            .limit(5)
            .getRawMany();

        return {
            labels: categorySales.map(c => c.category),
            data: categorySales.map(c => parseFloat(c.total_sales) || 0)
        };
    }

    async getMostProfitableProducts(period: string) {
        const { start, end } = this.getDateRange(period);

        const profitableProducts = await this.movimientoRepository
            .createQueryBuilder('m')
            .leftJoin('m.producto', 'producto')
            .leftJoin('producto.categoria', 'categoria')
            .leftJoin('m.nota', 'nota')
            .select('producto.nombre', 'product_name')
            .addSelect('categoria.nombre', 'category_name')
            .addSelect('SUM(m.cantidad)', 'units_sold')
            .addSelect('SUM(m.total_calculado)', 'total_revenue')
            .where('m.tipo_movimiento = :type', { type: 'salida' })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start, end })
            .andWhere('nota.estado_nota != :estado', { estado: 'ANULADA' })
            .groupBy('producto.id')
            .addGroupBy('producto.nombre')
            .addGroupBy('categoria.nombre')
            .orderBy('total_revenue', 'DESC')
            .limit(20)
            .getRawMany();

        return profitableProducts.map(p => ({
            product: p.product_name,
            category: p.category_name,
            unitsSold: parseInt(p.units_sold, 10),
            revenue: parseFloat(p.total_revenue)
        }));
    }
    async getDeadStock(days: number = 30) {
        const dateThreshold = subDays(new Date(), days);

        const deadStockProducts = await this.almacenProductoRepository
            .createQueryBuilder('ap')
            .innerJoin('ap.producto', 'producto')
            .leftJoin('producto.categoria', 'categoria')
            .leftJoin('Movimiento', 'm', 'm.productoId = producto.id AND m.tipo_movimiento = :type', { type: 'salida' })
            .leftJoin('Nota', 'n', 'n.id = m.notaId')
            .select([
                'producto.nombre AS product_name',
                'producto.imagen AS product_image',
                'categoria.nombre AS category_name',
                'ap.cantidad_actual AS current_stock',
                'MAX(n.fecha) as last_sale_date'
            ])
            .where('ap.cantidad_actual > 0')
            .groupBy('producto.id')
            .addGroupBy('producto.nombre')
            .addGroupBy('producto.imagen')
            .addGroupBy('categoria.nombre')
            .addGroupBy('ap.cantidad_actual')
            .having('MAX(n.fecha) < :dateThreshold OR MAX(n.fecha) IS NULL', { dateThreshold })
            .orderBy('last_sale_date', 'ASC') // Oldest first (or nulls first depending on DB)
            .limit(20) // Limit to top 20 critical items
            .getRawMany();

        return deadStockProducts.map(p => {
            const lastSale = p.last_sale_date ? new Date(p.last_sale_date) : null;
            const daysInactive = lastSale
                ? Math.floor((new Date().getTime() - lastSale.getTime()) / (1000 * 3600 * 24))
                : `> ${days}`;

            return {
                product: p.product_name,
                image: p.product_image,
                category: p.category_name,
                stock: p.current_stock,
                lastSale: lastSale ? format(lastSale, 'yyyy-MM-dd') : 'Sin movimientos',
                daysInactive
            };
        });
    }

    async getTopProductsByDateRange(startDate: string, endDate: string) {
        // Parse dates and set to start/end of day
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));

        console.log('getTopProductsByDateRange called with:', { startDate, endDate, start, end });

        const topProducts = await this.movimientoRepository
            .createQueryBuilder('movimiento')
            .leftJoinAndSelect('movimiento.producto', 'producto')
            .leftJoin('movimiento.nota', 'nota')
            .select('producto.nombre', 'name')
            .addSelect('SUM(movimiento.cantidad)', 'total_sold')
            .where('movimiento.tipo_movimiento = :type', { type: 'salida' })
            .andWhere('nota.fecha BETWEEN :start AND :end', { start, end })
            .andWhere('nota.estado_nota != :estado', { estado: 'ANULADA' })
            .groupBy('producto.id')
            .addGroupBy('producto.nombre')
            .orderBy('total_sold', 'DESC')
            .limit(10)
            .getRawMany();

        console.log('Found products:', topProducts.length, topProducts);

        return {
            labels: topProducts.map(p => p.name),
            data: topProducts.map(p => parseInt(p.total_sold, 10))
        };
    }


    async getStockoutPrediction(daysToAnalyze: number = 30) {
        // 1. Get sales for the last X days per product
        const endDate = new Date();
        const startDate = subDays(endDate, daysToAnalyze);

        // DEBUG: First check total count of 'salida' movements regardless of date
        const totalSalidas = await this.movimientoRepository.count({ where: { tipo_movimiento: 'salida' } });
        console.log('DEBUG: Total movements (salida) in DB:', totalSalidas);

        const salesStats = await this.movimientoRepository
            .createQueryBuilder('m')
            .leftJoin('m.nota', 'n')
            .select('m.productoId', 'productId')
            .addSelect('SUM(m.cantidad)', 'totalSold')
            //.where('m.tipo_movimiento = :type', { type: 'salida' }) // Assuming 'salida' is physically stored in DB
            // Let's rely on Nota type 'venta' which is safer if Movimiento type is inconsistent
            .where('n.tipo_nota = :tipoNota', { tipoNota: 'venta' })
            .andWhere('n.fecha BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('n.estado_nota != :estado', { estado: 'ANULADA' })
            .groupBy('m.productoId')
            .getRawMany();

        // Map to quick lookup
        const salesMap = new Map<number, number>();
        salesStats.forEach(stat => {
            salesMap.set(stat.productId, parseFloat(stat.totalSold) || 0);
        });

        // 2. Get current stock for all products (summing across warehouses if necessary, or just taking the total)
        // Adjust based on your schema. Assuming AlmacenProducto holds stock per warehouse.
        // We really want total stock available to sell.
        const stockStats = await this.almacenProductoRepository
            .createQueryBuilder('ap')
            .leftJoinAndSelect('ap.producto', 'p')
            .select('ap.productoId', 'productId')
            .addSelect('p.nombre', 'productName')
            .addSelect('p.imagen', 'productImage')
            .addSelect('SUM(ap.cantidad_actual)', 'currentStock')
            .groupBy('ap.productoId')
            .addGroupBy('p.nombre')
            .addGroupBy('p.imagen')
            .having('SUM(ap.cantidad_actual) > 0') // Only analyze items we actually have
            .getRawMany();

        console.log('Prediction Debug:');
        console.log('Date Range:', startDate, 'to', endDate);
        console.log('Sales Found:', salesStats.length);
        console.log('Stock Items Found:', stockStats.length);
        if (salesStats.length > 0) console.log('Sample Sale:', salesStats[0]);

        const predictions: {
            productId: number;
            productName: string;
            productImage: string;
            currentStock: number;
            dailyVelocity: number;
            daysLeft: number;
            suggestedPurchase: number;
        }[] = [];

        for (const item of stockStats) {
            const productId = item.productId;
            const currentStock = parseFloat(item.currentStock);
            const totalSold = salesMap.get(productId) || 0;

            if (totalSold > 0) {
                const dailyVelocity = totalSold / daysToAnalyze;
                const daysLeft = currentStock / dailyVelocity;

                // Calculate suggested purchase to cover 30 days
                // Only suggest if we have less than 30 days coverage
                const targetCoverageDays = 30;
                let suggestedPurchase = 0;

                if (daysLeft < targetCoverageDays) {
                    const diffDays = targetCoverageDays - daysLeft;
                    // Or simply: (Target - Current) -> (Velocity * TargetDays) - CurrentStock
                    suggestedPurchase = Math.ceil((dailyVelocity * targetCoverageDays) - currentStock);
                    if (suggestedPurchase < 0) suggestedPurchase = 0;
                }

                // Only care if it runs out relatively soon (e.g. within 60 days)
                // if (daysLeft <= 60) {
                predictions.push({
                    productId,
                    productName: item.productName,
                    productImage: item.productImage,
                    currentStock,
                    dailyVelocity,
                    daysLeft: Math.round(daysLeft),
                    suggestedPurchase
                });
                // }
            }
        }

        // 3. Sort by Risk (fewer days left = higher risk)
        return predictions.sort((a, b) => a.daysLeft - b.daysLeft);
    }
    async getProductSalesHistory(productId: number, startDate: Date, endDate: Date) {
        // Ensure dates are boundaries
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));

        const history = await this.movimientoRepository
            .createQueryBuilder('m')
            .leftJoin('m.nota', 'n')
            .select('DATE(n.fecha)', 'date')
            .addSelect('SUM(m.cantidad)', 'quantity')
            .addSelect('SUM(m.total_calculado)', 'total')
            .where('m.productoId = :productId', { productId })
            .andWhere('n.fecha BETWEEN :start AND :end', { start, end })
            .andWhere('n.tipo_nota = :tipo', { tipo: 'venta' })
            .andWhere('n.estado_nota != :estado', { estado: 'ANULADA' })
            .groupBy('DATE(n.fecha)')
            .orderBy('DATE(n.fecha)', 'ASC')
            .getRawMany();

        return history.map(h => ({
            date: format(new Date(h.date), 'yyyy-MM-dd'),
            quantity: Number(h.quantity),
            total: Number(h.total)
        }));
    }
}
