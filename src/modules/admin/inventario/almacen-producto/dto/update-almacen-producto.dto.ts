import { PartialType } from '@nestjs/mapped-types';
import { CreateAlmacenProductoDto } from './create-almacen-producto.dto';

export class UpdateAlmacenProductoDto extends PartialType(CreateAlmacenProductoDto) { }
