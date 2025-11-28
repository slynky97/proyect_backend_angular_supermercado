import { IsNumber, IsPositive } from 'class-validator';

export class CreateAlmacenProductoDto {
    @IsNumber()
    @IsPositive()
    productoId: number;

    @IsNumber()
    @IsPositive()
    almacenId: number;

    @IsNumber()
    cantidad_actual: number;
}
