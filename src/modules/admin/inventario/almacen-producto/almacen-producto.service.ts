import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlmacenProducto } from '../almacen/entities/almacen_producto.entity';
import { CreateAlmacenProductoDto } from './dto/create-almacen-producto.dto';
import { UpdateAlmacenProductoDto } from './dto/update-almacen-producto.dto';
import { Almacen } from '../almacen/entities/almacen.entity';
import { Producto } from '../producto/entities/producto.entity';

@Injectable()
export class AlmacenProductoService {
    constructor(
        @InjectRepository(AlmacenProducto)
        private readonly almacenProductoRepository: Repository<AlmacenProducto>,
        @InjectRepository(Almacen)
        private readonly almacenRepository: Repository<Almacen>,
        @InjectRepository(Producto)
        private readonly productoRepository: Repository<Producto>,
    ) { }

    async create(createDto: CreateAlmacenProductoDto): Promise<AlmacenProducto> {
        // Verify almacen exists
        const almacen = await this.almacenRepository.findOne({ where: { id: createDto.almacenId } });
        if (!almacen) {
            throw new NotFoundException('Almacén no encontrado');
        }

        // Verify producto exists
        const producto = await this.productoRepository.findOne({ where: { id: createDto.productoId } });
        if (!producto) {
            throw new NotFoundException('Producto no encontrado');
        }

        // Create stock assignment
        const almacenProducto = this.almacenProductoRepository.create({
            almacen,
            producto,
            cantidad_actual: createDto.cantidad_actual,
            fecha_actualizacion: new Date(),
        });

        return this.almacenProductoRepository.save(almacenProducto);
    }

    async findAll(): Promise<AlmacenProducto[]> {
        return this.almacenProductoRepository.find({
            relations: ['almacen', 'almacen.sucursal', 'producto', 'producto.categoria'],
        });
    }

    async findOne(id: number): Promise<AlmacenProducto> {
        const almacenProducto = await this.almacenProductoRepository.findOne({
            where: { id },
            relations: ['almacen', 'almacen.sucursal', 'producto', 'producto.categoria'],
        });

        if (!almacenProducto) {
            throw new NotFoundException('Registro de stock no encontrado');
        }

        return almacenProducto;
    }

    async findByAlmacen(almacenId: number): Promise<AlmacenProducto[]> {
        return this.almacenProductoRepository.find({
            where: { almacen: { id: almacenId } },
            relations: ['almacen', 'almacen.sucursal', 'producto', 'producto.categoria'],
        });
    }

    async findByProducto(productoId: number): Promise<AlmacenProducto[]> {
        return this.almacenProductoRepository.find({
            where: { producto: { id: productoId } },
            relations: ['almacen', 'almacen.sucursal', 'producto', 'producto.categoria'],
        });
    }

    async update(id: number, updateDto: UpdateAlmacenProductoDto): Promise<AlmacenProducto> {
        const almacenProducto = await this.findOne(id);

        // Update almacen if provided
        if (updateDto.almacenId) {
            const almacen = await this.almacenRepository.findOne({ where: { id: updateDto.almacenId } });
            if (!almacen) {
                throw new NotFoundException('Almacén no encontrado');
            }
            almacenProducto.almacen = almacen;
        }

        // Update producto if provided
        if (updateDto.productoId) {
            const producto = await this.productoRepository.findOne({ where: { id: updateDto.productoId } });
            if (!producto) {
                throw new NotFoundException('Producto no encontrado');
            }
            almacenProducto.producto = producto;
        }

        // Update cantidad if provided
        if (updateDto.cantidad_actual !== undefined) {
            almacenProducto.cantidad_actual = updateDto.cantidad_actual;
        }

        // Update fecha
        almacenProducto.fecha_actualizacion = new Date();

        return this.almacenProductoRepository.save(almacenProducto);
    }

    async remove(id: number): Promise<void> {
        const almacenProducto = await this.findOne(id);
        await this.almacenProductoRepository.remove(almacenProducto);
    }
}
