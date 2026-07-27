import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { SignOptions } from 'jsonwebtoken';
import { CompanyModule } from './company.module';
import { LoginUseCase } from './application/usecases/auth/login.usecase';
import { RegisterUseCase } from './application/usecases/auth/register.usecase';
import { DatabaseModule } from './infra/database/database.module';
import { RedisModule } from './infra/redis/redis.module';
import { JwtAuthGuard } from './infra/guards/jwt-auth.guard';
import { RolesGuard } from './infra/guards/roles.guard';
import { PartModule } from './part.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { UserModule } from './user.module';

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: Number(process.env.THROTTLE_TTL_MS ?? 60000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '1d') as SignOptions['expiresIn'],
      },
    }),
    DatabaseModule,
    CompanyModule,
    UserModule,
    PartModule,
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    JwtAuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
