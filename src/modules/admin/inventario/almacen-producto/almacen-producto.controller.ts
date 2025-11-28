import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AlmacenProductoService } from './almacen-producto.service';
import { CreateAlmacenProductoDto } from './dto/create-almacen-producto.dto';
import { UpdateAlmacenProductoDto } from './dto/update-almacen-producto.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/modules/auth/auth.guard';

@ApiBearerAuth()
// @UseGuards(AuthGuard) // Comentado temporalmente para pruebas - DESCOMENTAR EN PRODUCCIÓN
@Controller('almacen-producto')
export class AlmacenProductoController {
    constructor(private readonly almacenProductoService: AlmacenProductoService) { }

    @Post()
    create(@Body() createDto: CreateAlmacenProductoDto) {
        return this.almacenProductoService.create(createDto);
    }

    @Get()
    findAll() {
        return this.almacenProductoService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.almacenProductoService.findOne(+id);
    }

    @Get('almacen/:almacenId')
    findByAlmacen(@Param('almacenId') almacenId: string) {
        return this.almacenProductoService.findByAlmacen(+almacenId);
    }

    @Get('producto/:productoId')
    findByProducto(@Param('productoId') productoId: string) {
        return this.almacenProductoService.findByProducto(+productoId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateAlmacenProductoDto) {
        return this.almacenProductoService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.almacenProductoService.remove(+id);
    }
}
