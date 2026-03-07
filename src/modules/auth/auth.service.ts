import { HttpException, Injectable } from '@nestjs/common';
import { User } from '../admin/users/entities/user.entity';
import { UsersService } from '../admin/users/users.service';
import { loginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { access } from 'fs';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
    // Inyectamos el userService
    constructor(private userService: UsersService, private jwtService: JwtService) {

    }

    async login(credenciales: loginAuthDto){
        const {email, password} = credenciales;

        // Buscar el usuario por su email
        const usuario = await this.userService.findOneByEmail(email);
        if(!usuario){
            throw new HttpException('Usuario no encontrado', 404);
        }

        // verificar la contraseña
        const verificarPass = await compare(password, usuario.password);
        if(!verificarPass){
            throw new HttpException('password incorrecto', 401);
        }

        // generar JWT
        const payload = { email: email, id: usuario.id }
        
        const token = this.jwtService.sign(payload);

        return {access_token: token, user: usuario};
    }

}
