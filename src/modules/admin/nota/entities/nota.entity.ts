import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cliente } from "../../cliente/entities/cliente.entity";
import { User } from "../../users/entities/user.entity";
import { Movimiento } from "./movimiento.entity";

@Entity('notas')
export class Nota {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    @Column()
    tipo_nota: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    impuestos: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    descuento: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total_calculado: number;

    @Column({ length: 50 })
    estado_nota: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @ManyToOne(() => Cliente, { eager: true, nullable: true })
    cliente?: Cliente;

    @ManyToOne(() => User, { eager: true })
    user: User;

    @OneToMany(() => Movimiento, mov => mov.nota)
    movimientos: Movimiento[];
}
