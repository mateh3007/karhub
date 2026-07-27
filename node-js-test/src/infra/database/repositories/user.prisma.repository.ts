import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { UserEntity } from 'src/domain/entities/user.entity';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserPrismaRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(entity: UserEntity): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        id: entity.id,
        name: entity.name,
        email: entity.email,
        password: entity.password,
        role: entity.role,
        companyId: entity.companyId,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? this.toDomain(user) : null;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
    });
    return users.map((user) => this.toDomain(user));
  }

  async update(entity: UserEntity): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        email: entity.email,
        password: entity.password,
        role: entity.role,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByCompanyId(companyId: string): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
    });
    return users.map((user) => this.toDomain(user));
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    return user ? this.toDomain(user) : null;
  }

  private toDomain(user: User): UserEntity {
    return new UserEntity({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as unknown as RoleEnum,
      companyId: user.companyId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }
}
