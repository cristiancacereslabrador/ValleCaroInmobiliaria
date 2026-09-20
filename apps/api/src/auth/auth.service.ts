import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { BrokerUser } from './entities/broker-user.entity';
import type { BrokerJwtPayload } from './jwt-auth.guard';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(BrokerUser)
    private readonly users: Repository<BrokerUser>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const login = this.configService.get<string>('BROKER_EMAIL', 'lisecita').trim().toLowerCase();
    const password = this.configService.get<string>('BROKER_PASSWORD', 'changeme123');
    const name = this.configService.get<string>('BROKER_NAME', 'Administrador');
    const passwordHash = await bcrypt.hash(password, 10);

    let user = await this.users.findOne({ where: { email: login } });
    if (!user) {
      user = (await this.users.find({ order: { createdAt: 'ASC' }, take: 1 }))[0] ?? null;
    }

    if (user) {
      user.email = login;
      user.name = name;
      user.passwordHash = passwordHash;
      await this.users.save(user);
      this.logger.log(`Usuario staff actualizado: ${login}`);
      return;
    }

    await this.users.save(this.users.create({ email: login, name, passwordHash }));
    this.logger.log(`Usuario staff inicial creado: ${login}`);
  }

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: BrokerJwtPayload = { sub: user.id, email: user.email };
    const secret = this.configService.get<string>('JWT_SECRET', 'dev-only-change-me');
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}
