import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Nota } from './entities/nota.entity';
import { Producto } from '../inventario/producto/entities/producto.entity';
import { Almacen } from '../inventario/almacen/entities/almacen.entity';
import { Movimiento } from './entities/movimiento.entity';
import { QueryRunner } from 'typeorm';
import { AlmacenProducto } from '../inventario/almacen/entities/almacen_producto.entity';
import { FindNotaDto } from './dto/find-nota-dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotaService {

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService
  ) {

  }

  async create(createNotaDto: CreateNotaDto) {

    // trabjar con transacciones
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction()

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const clienteRepo = queryRunner.manager.getRepository(Cliente);
      const notaRepo = queryRunner.manager.getRepository(Nota);
      const productoRepo = queryRunner.manager.getRepository(Producto);
      const almacenRepo = queryRunner.manager.getRepository(Almacen);
      const movRepo = queryRunner.manager.getRepository(Movimiento);

      const user = await userRepo.findOneBy({ id: createNotaDto.user });
      if (!user) throw new NotFoundException('Usuario no encontrado');


      // Cliente is optional
      let cliente: Cliente | undefined = undefined;
      if (createNotaDto.cliente) {
        cliente = await clienteRepo.findOneBy({ id: createNotaDto.cliente }) || undefined;
        if (!cliente) throw new NotFoundException('Cliente no encontrado');
      }

      // crear nota

      const nota = await notaRepo.create({
        ...createNotaDto,
        cliente: cliente || undefined,
        user: user
      })
      console.log(nota);
      // guardar la nota para obtener el ID para movimientos
      await notaRepo.save(nota);

      const movimientosGuardados: Movimiento[] = []

      for (const m of createNotaDto.movimientos) {
        const producto = await productoRepo.findOneBy({ id: m.producto_id });
        if (!producto) throw new NotFoundException('Producto no encontrado');

        const almacen = await almacenRepo.findOneBy({ id: m.almacen_id });
        if (!almacen) throw new NotFoundException('Almacen no encontrado');

        const movimiento = movRepo.create({
          ...m,
          nota: nota,
          producto,
          almacen
        });
        await this.actualizarStock(queryRunner, almacen, producto, m.cantidad, m.tipo_movimiento);

        const movGuardado = await movRepo.save(movimiento);
        movimientosGuardados.push(movGuardado)
      }

      nota.movimientos = movimientosGuardados;
      await queryRunner.commitTransaction();

      // Send Email Alert (Fire and forget)
      if (createNotaDto.tipo_nota === 'venta') {
        this.emailService.sendNewSaleAlert(nota).catch(err => console.error('Failed to send sale alert', err));
      }

      return nota;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  private async actualizarStock(queryRunner: QueryRunner, almacen: Almacen, producto: Producto, cantidad: number, tipo: 'ingreso' | 'salida' | 'devolucion') {
    const almacenProductoRep = queryRunner.manager.getRepository(AlmacenProducto)

    let ap = await almacenProductoRep.findOne({
      where: {
        almacen: { id: almacen.id },
        producto: { id: producto.id },
      },
      relations: ['almacen', 'producto']
    });
    if (!ap) {
      if (tipo === 'salida') {
        throw new BadRequestException('No hay stock registrado para este producto en este amlacen')
      }

      ap = almacenProductoRep.create({
        almacen, producto, cantidad_actual: cantidad, fecha_actualizacion: new Date()
      })
    } else {
      if (tipo === 'ingreso' || tipo === 'devolucion') {
        ap.cantidad_actual += cantidad;
      } else if (tipo === 'salida') {
        if (ap.cantidad_actual < cantidad) {
          throw new BadRequestException('Stock Insuficiente par la salida');
        }
        ap.cantidad_actual -= cantidad
      }
      ap.fecha_actualizacion = new Date()
    }
    await almacenProductoRep.save(ap);

    // Check for low stock alert
    if (ap.cantidad_actual <= 10) {
      this.emailService.sendLowStockAlert(producto.nombre, ap.cantidad_actual).catch(err => console.error('Failed to send low stock alert', err));
    }

  }

  async findAll(findNotaDto: FindNotaDto) {
    const queryBuilder = this.dataSource.getRepository(Nota).createQueryBuilder('nota')

    queryBuilder.leftJoinAndSelect('nota.cliente', 'cliente')
    queryBuilder.leftJoinAndSelect('nota.user', 'user')
    queryBuilder.leftJoinAndSelect('nota.movimientos', 'movimientos')
    queryBuilder.leftJoinAndSelect('movimientos.producto', 'producto')
    queryBuilder.leftJoinAndSelect('movimientos.almacen', 'almacen')
    queryBuilder.orderBy('nota.fecha', 'DESC');

    if (findNotaDto.tipo_nota) {
      queryBuilder.andWhere('nota.tipo_nota = :tipo_nota', { tipo_nota: findNotaDto.tipo_nota });
    }

    if (findNotaDto.estado_nota) {
      queryBuilder.andWhere('nota.estado_nota = :estado_nota', { estado_nota: findNotaDto.estado_nota });
    }

    if (findNotaDto.fecha_inicio) {
      queryBuilder.andWhere('nota.fecha >= :fecha_inicio', { fecha_inicio: findNotaDto.fecha_inicio });
    }
    if (findNotaDto.fecha_fin) {
      queryBuilder.andWhere('nota.fecha <= :fecha_fin', { fecha_fin: findNotaDto.fecha_fin });
    }

    if (findNotaDto.cliente_nombre) {
      if (findNotaDto.cliente_nombre.toLowerCase() === 'venta general') {
        queryBuilder.andWhere('cliente.id IS NULL');
      } else {
        queryBuilder.andWhere('cliente.razon_social ILIKE :cliente_nombre', { cliente_nombre: `%${findNotaDto.cliente_nombre}%` });
      }
    }

    if (findNotaDto.producto_nombre) {
      queryBuilder.andWhere('producto.nombre ILIKE :producto_nombre', { producto_nombre: `%${findNotaDto.producto_nombre}%` });
    }

    // Pagination
    const page = findNotaDto.page || 1;
    const limit = findNotaDto.limit || 10;
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);


    const [notas, total] = await queryBuilder.getManyAndCount();

    // Return empty result instead of throwing 404 for empty pages (except maybe page 1? No, empty list is fine)
    return { data: notas, total };
  }

  findOne(id: number) {
    return `This action returns a #${id} nota`;
  }

  update(id: number, updateNotaDto: UpdateNotaDto) {
    return `This action updates a #${id} nota`;
  }

  remove(id: number) {
    return `This action removes a #${id} nota`;
  }
}