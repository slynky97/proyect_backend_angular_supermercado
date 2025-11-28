import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class FindNotaDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    tipo_nota?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    estado_nota?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    fecha_inicio?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    fecha_fin?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    cliente_nombre?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    producto_nombre?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    page?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    limit?: number;
}