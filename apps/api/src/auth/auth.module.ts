import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BrokerUser } from './entities/broker-user.entity';
import { JwtAuthGuard, OptionalJwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([BrokerUser])],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
