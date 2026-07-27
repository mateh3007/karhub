import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { LoginUseCase } from './application/usecases/auth/login.usecase';
import { RegisterUseCase } from './application/usecases/auth/register.usecase';
import { CreateCompanyUseCase } from './application/usecases/companies/create-company.usecase';
import { DeleteCompanyUseCase } from './application/usecases/companies/delete-company.usecase';
import { GetAllCompaniesUseCase } from './application/usecases/companies/get-all-companies.usecase';
import { GetCompanyByIdUseCase } from './application/usecases/companies/get-company-by-id.usecase';
import { UpdateCompanyUseCase } from './application/usecases/companies/update-company.usecase';
import { PartPriorityService } from './application/services/part-priority.service';
import { CacheAdapter } from './domain/adapters/cache.adapter';
import { RedisCacheAdapter } from './infra/adapters/redis-cache.adapter';
import { CreatePartUseCase } from './application/usecases/parts/create-part.usecase';
import { DeletePartUseCase } from './application/usecases/parts/delete-part.usecase';
import { GetAllPartsUseCase } from './application/usecases/parts/get-all-parts.usecase';
import { GetPartByIdUseCase } from './application/usecases/parts/get-part-by-id.usecase';
import { GetRestockPrioritiesUseCase } from './application/usecases/parts/get-restock-priorities.usecase';
import { UpdatePartUseCase } from './application/usecases/parts/update-part.usecase';
import { CreateUserUseCase } from './application/usecases/users/create-user.usecase';
import { DeleteUserUseCase } from './application/usecases/users/delete-user.usecase';
import { GetAllUsersUseCase } from './application/usecases/users/get-all-users.usecase';
import { GetUserByIdUseCase } from './application/usecases/users/get-user-by-id.usecase';
import { UpdateUserUseCase } from './application/usecases/users/update-user.usecase';
import { CompanyRepository } from './domain/repositories/company.repository';
import { PartRepository } from './domain/repositories/part.repository';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaModule } from './infra/database/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { CompanyPrismaRepository } from './infra/database/repositories/company.prisma.repository';
import { PartPrismaRepository } from './infra/database/repositories/part.prisma.repository';
import { UserPrismaRepository } from './infra/database/repositories/user.prisma.repository';
import { JwtAuthGuard } from './infra/guards/jwt-auth.guard';
import { RolesGuard } from './infra/guards/roles.guard';
import { AuthController } from './presentation/controllers/auth.controller';
import { CompaniesController } from './presentation/controllers/companies.controller';
import { PartsController } from './presentation/controllers/parts.controller';
import { RestockController } from './presentation/controllers/restock.controller';
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '1d') as SignOptions['expiresIn'],
      },
    }),
  ],
  controllers: [
    CompaniesController,
    UsersController,
    PartsController,
    RestockController,
    AuthController,
  ],
  providers: [
    { provide: CompanyRepository, useClass: CompanyPrismaRepository },
    { provide: UserRepository, useClass: UserPrismaRepository },
    { provide: PartRepository, useClass: PartPrismaRepository },
    { provide: CacheAdapter, useClass: RedisCacheAdapter },
    CreateCompanyUseCase,
    GetAllCompaniesUseCase,
    GetCompanyByIdUseCase,
    UpdateCompanyUseCase,
    DeleteCompanyUseCase,
    CreateUserUseCase,
    GetAllUsersUseCase,
    GetUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    CreatePartUseCase,
    GetAllPartsUseCase,
    GetPartByIdUseCase,
    UpdatePartUseCase,
    DeletePartUseCase,
    GetRestockPrioritiesUseCase,
    PartPriorityService,
    RegisterUseCase,
    LoginUseCase,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
