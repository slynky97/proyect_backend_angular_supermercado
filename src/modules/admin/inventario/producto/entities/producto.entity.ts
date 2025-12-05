import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Categoria } from "../../categoria/entities/categoria.entity";
import { AlmacenProducto } from "../../almacen/entities/almacen_producto.entity";

@Entity('productos')
export class Producto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    nombre: string;

    @Column({ type: 'text' })
    descripcion: string;

    @Column({ length: 100, unique: true, nullable: true })
    codigo_barra: string;

    @Column({ length: 50 })
    unidad_medida: string;

    @Column({ length: 100, nullable: true })
    marca: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    precio_venta_actual: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    precio_unitario_compra: number;

    @Column({ length: 255, nullable: true })
    imagen: string;

    @Column()
    estado: boolean;

    @ManyToOne(() => Categoria, cat => cat.productos, { eager: true })
    categoria: Categoria;

    @OneToMany(() => AlmacenProducto, ap => ap.producto)
    almacenes: AlmacenProducto[];
}