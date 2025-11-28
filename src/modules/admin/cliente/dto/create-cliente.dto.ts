import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from "class-validator";

export class CreateClienteDto {
    @IsString()
    @IsIn(['cliente', 'proveedor'])
    tipo: 'cliente' | 'proveedor';

    @IsString()
    razon_social: string;

    @IsString()
    @IsOptional()
    ci_nit_ruc_rut?: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsString()
    @IsOptional()
    direccion?: string;

    @IsString()
    @IsOptional()
    @IsEmail()
    correo?: string;

    @IsBoolean()
    estado: boolean;
}
