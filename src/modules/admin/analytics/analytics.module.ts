import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Nota } from '../nota/entities/nota.entity';
import { Movimiento } from '../nota/entities/movimiento.entity';
import { AlmacenProducto } from '../inventario/almacen/entities/almacen_producto.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Nota, Movimiento, AlmacenProducto])
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService]
})
export class AnalyticsModule { }
