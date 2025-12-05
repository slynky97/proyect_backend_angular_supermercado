import { PartialType } from '@nestjs/mapped-types';
import { CreateAlmacenProductoDto } from './create-almacen-producto.dto';

import { IsOptional, IsString } from 'class-validator';

export class UpdateAlmacenProductoDto extends PartialType(CreateAlmacenProductoDto) { }
