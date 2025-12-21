import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginAuthDto } from './dto/login-auth.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {

    }

    @Post("/login")
    funLogin(@Body() datos: loginAuthDto) {
        return this.authService.login(datos);
    }

    @UseGuards(AuthGuard)
    @Get('/check-token')
    checkToken(@Request() req: any) {
        return req.user;
    }
}
