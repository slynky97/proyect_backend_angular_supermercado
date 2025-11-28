import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>
  ) { }

  async create(createClienteDto: CreateClienteDto) {
    const cliente = this.clienteRepo.create(createClienteDto);
    return await this.clienteRepo.save(cliente);
  }

  async findAll() {
    return await this.clienteRepo.find({
      where: { estado: true }
    });
  }

  async findOne(id: number) {
    const cliente = await this.clienteRepo.findOneBy({ id });
    if (!cliente) throw new NotFoundException(`Cliente #${id} no encontrado`);
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    const cliente = await this.findOne(id);
    this.clienteRepo.merge(cliente, updateClienteDto);
    return await this.clienteRepo.save(cliente);
  }

  async remove(id: number) {
    const cliente = await this.findOne(id);
    cliente.estado = false; // Soft delete
    return await this.clienteRepo.save(cliente);
  }
}
