import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDateString, IsDecimal, IsNotEmpty, IsNumber, IsOptional, isString, IsString, IsUUID } from "class-validator";

export class CreateNotaDto {

    @ApiProperty()
    @IsDateString()
    fecha: Date;

    @ApiProperty()
    @IsString()
    tipo_nota: string; // 'compra' || 'venta'


    @ApiProperty({required: true})
    @IsDecimal()
    @IsOptional()
    impuestos?: number;

    @ApiProperty()
    @IsDecimal()
    @IsOptional()
    descuento: number;

    @ApiProperty()
    @IsDecimal()
    total_calculado: number;

    @ApiProperty()
    @IsString()
    estado_nota: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    observaciones?: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    cliente?: number;

    @ApiProperty()
    @IsString()
    @IsUUID('4', {each: true})
    user: string;

    @ApiProperty()
    @IsArray()
    movimientos: MovimientoDto[];
}

class MovimientoDto{
    @ApiProperty()
    @IsNumber()
    producto_id: number;

    @ApiProperty()
    @IsNumber()
    almacen_id: number;

    @ApiProperty()
    @IsNumber()
    cantidad: number;

    @ApiProperty()
    @IsString()
    tipo_movimiento: 'ingreso' | 'salida' | 'devolucion';

    @ApiProperty({required: false})
    @IsDecimal()
    @IsOptional()
    precio_unitario_compra?: number;

    @ApiProperty({required: false})
    @IsDecimal()
    @IsOptional()
    precio_unitario_venta?: number;

    @ApiProperty()
    @IsDecimal()
    total_calculado: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    observaciones: string;
}
