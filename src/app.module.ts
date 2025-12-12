import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/admin/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InventarioModule } from './modules/admin/inventario/inventario.module';
import { RolesModule } from './modules/admin/roles/roles.module';
import { PermissionsModule } from './modules/admin/permissions/permissions.module';
import { ConfigModule } from '@nestjs/config';
import { NotaModule } from './modules/admin/nota/nota.module';
import { ClienteModule } from './modules/admin/cliente/cliente.module';
import { AnalyticsModule } from './modules/admin/analytics/analytics.module';
import { EmailModule } from './modules/admin/email/email.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.development.env', '.production.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || "localhost",
      port: +`${process.env.DATABASE_PORT}` || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_pASSWORD || '12345',
      database: process.env.DATABASE_NAME || 'backend_nest_inventario',
      entities: [
        __dirname + '/../**/*.entity{.ts,.js}',
      ],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    InventarioModule,
    PermissionsModule,
    RolesModule,
    NotaModule,
    ClienteModule,
    AnalyticsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
