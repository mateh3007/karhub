import { Injectable } from '@nestjs/common';
import { Part } from '@prisma/client';
import { PartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PartPrismaRepository extends PartRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(entity: PartEntity): Promise<PartEntity> {
    const created = await this.prisma.part.create({
      data: {
        id: entity.id,
        name: entity.name,
        category: entity.category,
        currentStock: entity.currentStock,
        minimumStock: entity.minimumStock,
        averageDailySales: entity.averageDailySales,
        leadTimeDays: entity.leadTimeDays,
        unitCost: entity.unitCost,
        criticalityLevel: entity.criticalityLevel,
        companyId: entity.companyId,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<PartEntity | null> {
    const part = await this.prisma.part.findFirst({
      where: { id, deletedAt: null },
    });
    return part ? this.toDomain(part) : null;
  }

  async findAll(): Promise<PartEntity[]> {
    const parts = await this.prisma.part.findMany({
      where: { deletedAt: null },
    });
    return parts.map((part) => this.toDomain(part));
  }

  async update(entity: PartEntity): Promise<PartEntity> {
    const updated = await this.prisma.part.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        category: entity.category,
        currentStock: entity.currentStock,
        minimumStock: entity.minimumStock,
        averageDailySales: entity.averageDailySales,
        leadTimeDays: entity.leadTimeDays,
        unitCost: entity.unitCost,
        criticalityLevel: entity.criticalityLevel,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.part.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByCompanyId(
    companyId: string,
    category?: string,
  ): Promise<PartEntity[]> {
    const parts = await this.prisma.part.findMany({
      where: { companyId, deletedAt: null, ...(category ? { category } : {}) },
    });
    return parts.map((part) => this.toDomain(part));
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<PartEntity | null> {
    const part = await this.prisma.part.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    return part ? this.toDomain(part) : null;
  }

  private toDomain(part: Part): PartEntity {
    return new PartEntity({
      id: part.id,
      name: part.name,
      category: part.category,
      currentStock: part.currentStock,
      minimumStock: part.minimumStock,
      averageDailySales: part.averageDailySales,
      leadTimeDays: part.leadTimeDays,
      unitCost: part.unitCost,
      criticalityLevel: part.criticalityLevel,
      companyId: part.companyId,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
      deletedAt: part.deletedAt,
    });
  }
}
