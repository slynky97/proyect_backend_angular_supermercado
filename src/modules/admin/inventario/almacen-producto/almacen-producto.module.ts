import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlmacenProductoController } from './almacen-producto.controller';
import { AlmacenProductoService } from './almacen-producto.service';
import { AlmacenProducto } from '../almacen/entities/almacen_producto.entity';
import { Almacen } from '../almacen/entities/almacen.entity';
import { Producto } from '../producto/entities/producto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AlmacenProducto, Almacen, Producto])],
    controllers: [AlmacenProductoController],
    providers: [AlmacenProductoService],
    exports: [AlmacenProductoService],
})
export class AlmacenProductoModule { }
