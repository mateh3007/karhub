import { Module } from '@nestjs/common';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { PrismaModule } from './prisma.module';
import { CompanyPrismaRepository } from './repositories/company.prisma.repository';
import { PartPrismaRepository } from './repositories/part.prisma.repository';
import { UserPrismaRepository } from './repositories/user.prisma.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: CompanyRepository, useClass: CompanyPrismaRepository },
    { provide: UserRepository, useClass: UserPrismaRepository },
    { provide: PartRepository, useClass: PartPrismaRepository },
  ],
  exports: [CompanyRepository, UserRepository, PartRepository],
})
export class DatabaseModule {}
