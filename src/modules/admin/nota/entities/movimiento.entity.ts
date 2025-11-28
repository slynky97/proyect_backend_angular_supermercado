import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Nota } from "./nota.entity";
import { Producto } from "../../inventario/producto/entities/producto.entity";
import { Almacen } from "../../inventario/almacen/entities/almacen.entity";

@Entity('movimientos')
export class Movimiento {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Nota, nota => nota.movimientos)
    nota: Nota;

    @ManyToOne(() => Producto, { eager: true })
    producto: Producto;

    @ManyToOne(() => Almacen, { eager: true })
    almacen: Almacen;

    @Column({ type: 'int' })
    cantidad: number;

    @Column({ type: 'varchar', precision: 20, nullable: true })
    tipo_movimiento: 'ingreso' | 'salida' | 'devolucion';

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    precio_unitario_compra?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    precio_unitario_venta?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    total_calculado;

    @Column({ type: 'text', nullable: true })
    observaciones: string;
}
