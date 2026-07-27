import { Injectable } from '@nestjs/common';
import { Company } from '@prisma/client';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CompanyPrismaRepository extends CompanyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(entity: CompanyEntity): Promise<CompanyEntity> {
    const created = await this.prisma.company.create({
      data: {
        id: entity.id,
        cnpj: entity.cnpj,
        corporateName: entity.corporateName,
        tradeName: entity.tradeName,
        contactEmail: entity.contactEmail,
        phone: entity.phone,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
    });
    return company ? this.toDomain(company) : null;
  }

  async findAll(): Promise<CompanyEntity[]> {
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null },
    });
    return companies.map((company) => this.toDomain(company));
  }

  async update(entity: CompanyEntity): Promise<CompanyEntity> {
    const updated = await this.prisma.company.update({
      where: { id: entity.id },
      data: {
        corporateName: entity.corporateName,
        tradeName: entity.tradeName,
        contactEmail: entity.contactEmail,
        phone: entity.phone,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByCnpj(cnpj: string): Promise<CompanyEntity | null> {
    const company = await this.prisma.company.findFirst({
      where: { cnpj, deletedAt: null },
    });
    return company ? this.toDomain(company) : null;
  }

  async findByEmail(email: string): Promise<CompanyEntity | null> {
    const company = await this.prisma.company.findFirst({
      where: { contactEmail: email, deletedAt: null },
    });
    return company ? this.toDomain(company) : null;
  }

  private toDomain(company: Company): CompanyEntity {
    return new CompanyEntity({
      id: company.id,
      cnpj: company.cnpj,
      corporateName: company.corporateName,
      tradeName: company.tradeName,
      contactEmail: company.contactEmail,
      phone: company.phone,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      deletedAt: company.deletedAt,
    });
  }
}
