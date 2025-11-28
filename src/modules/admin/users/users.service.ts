import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { In, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {

  }

  async create(createUserDto: CreateUserDto) {
    console.log("Guardando en servicio .... ", createUserDto);

    const existeName = await this.userRepository.findOne({ where: { name: createUserDto.name } })

    if (existeName) {
      throw new BadRequestException(`El nombre ${createUserDto.name} ya esta en uso`);
    }

    const existeEmail = await this.userRepository.findOne({ where: { email: createUserDto.email } })

    if (existeEmail) {
      throw new BadRequestException(`El email ${createUserDto.email} ya esta en uso`);
    }

    //const nuevoUser = this.userRepository.create(createUserDto);

    // roles
    let roles: Role[] = [];
    if (createUserDto.roleIds?.length) {
      roles = await this.roleRepository.find({ where: { id: In(createUserDto.roleIds) } })
      if (roles.length !== createUserDto.roleIds.length) {
        throw new BadRequestException('Uno o mas roleIds no son validos')
      }
    }


    // encriptar
    const hashPassword = await bcrypt.hash(createUserDto.password, 12);
    const newUser = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashPassword,
      roles
    });

    this.userRepository.save(newUser);

    const { password, ...resto_datos } = newUser;

    return resto_datos;
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) throw new NotFoundException('El usuario no existe');

    return user;
  }


  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) throw new NotFoundException(`El usuario con email: ${email} no existe`);

    return user;
  }


  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    // Handle roles update
    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.find({
        where: { id: In(updateUserDto.roleIds) }
      });

      if (roles.length !== updateUserDto.roleIds.length) {
        throw new BadRequestException('Uno o mas roleIds no son validos');
      }

      user.roles = roles;
      delete updateUserDto.roleIds;
    }

    // Handle password update
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    this.userRepository.merge(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('El usuario no existe');
  }
}
