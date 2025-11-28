import { Module } from '@nestjs/common';
import { CategoriaModule } from './categoria/categoria.module';
import { SucursalModule } from './sucursal/sucursal.module';
import { AlmacenModule } from './almacen/almacen.module';
import { ProductoModule } from './producto/producto.module';
import { AlmacenProductoModule } from './almacen-producto/almacen-producto.module';

@Module({
  imports: [CategoriaModule, SucursalModule, AlmacenModule, ProductoModule, AlmacenProductoModule]
})
export class InventarioModule { }
