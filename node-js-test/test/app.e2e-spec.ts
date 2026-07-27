import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Restock flow (e2e)', () => {
  let app: INestApplication<App>;
  const suffix = Date.now().toString();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/parts').expect(401);
  });

  it('registers a company with an admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        corporateName: `Auto Pecas E2E ${suffix}`,
        tradeName: 'Auto Pecas E2E',
        cnpj: `1${suffix}`.slice(0, 14).padEnd(14, '0'),
        phone: '11999999999',
        contactEmail: `admin-${suffix}@e2e.com`,
        adminName: 'Admin E2E',
        adminPassword: 'senhaSegura123',
      })
      .expect(201);

    expect(response.body.user.role).toBe('ADMIN');
  });

  it('logs in and receives an access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `admin-${suffix}@e2e.com`, password: 'senhaSegura123' })
      .expect(200);

    expect(typeof response.body.accessToken).toBe('string');
  });

  it('creates a part and sees it prioritized when it needs restocking', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `admin-${suffix}@e2e.com`, password: 'senhaSegura123' })
      .expect(200);
    const token = login.body.accessToken as string;

    const createResponse = await request(app.getHttpServer())
      .post('/parts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Filtro de Oleo E2E',
        category: 'engine',
        currentStock: 15,
        minimumStock: 20,
        averageDailySales: 4,
        leadTimeDays: 5,
        unitCost: 18.5,
        criticalityLevel: 3,
      })
      .expect(201);

    expect(createResponse.body.currentStock).toBe(15);

    const priorities = await request(app.getHttpServer())
      .get('/restock/priorities')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const created = priorities.body.priorities.find(
      (item: { partId: string }) => item.partId === createResponse.body.id,
    );
    expect(created).toBeDefined();
    expect(created.projectedStock).toBe(-5);
    expect(created.urgencyScore).toBe(75);
  });

  it('rejects a USER trying to create a part (admin-only)', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `admin-${suffix}@e2e.com`, password: 'senhaSegura123' })
      .expect(200);
    const adminToken = adminLogin.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Regular User E2E',
        email: `user-${suffix}@e2e.com`,
        password: 'senhaSegura123',
        role: 'USER',
      })
      .expect(201);

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `user-${suffix}@e2e.com`, password: 'senhaSegura123' })
      .expect(200);
    const userToken = userLogin.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/parts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Should Fail',
        category: 'misc',
        currentStock: 1,
        minimumStock: 1,
        averageDailySales: 1,
        leadTimeDays: 1,
        unitCost: 1,
        criticalityLevel: 1,
      })
      .expect(403);
  });

  it('keeps company and user data isolated between tenants', async () => {
    const otherSuffix = `${suffix}-other`;

    const otherRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        corporateName: `Auto Pecas E2E ${otherSuffix}`,
        tradeName: 'Auto Pecas E2E Other',
        cnpj: `2${otherSuffix.replace(/\D/g, '')}`.slice(0, 14).padEnd(14, '0'),
        phone: '11988888888',
        contactEmail: `admin-${otherSuffix}@e2e.com`,
        adminName: 'Admin Other E2E',
        adminPassword: 'senhaSegura123',
      })
      .expect(201);
    const otherCompanyId = otherRegister.body.company.id as string;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `admin-${suffix}@e2e.com`, password: 'senhaSegura123' })
      .expect(200);
    const adminToken = adminLogin.body.accessToken as string;

    const meResponse = await request(app.getHttpServer())
      .get('/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const ownCompanyId = meResponse.body[0].id as string;
    expect(meResponse.body).toHaveLength(1);

    const ownUsers = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const adminId = (
      ownUsers.body as Array<{ id: string; email: string }>
    ).find((user) => user.email === `admin-${suffix}@e2e.com`)?.id;
    expect(adminId).toBeDefined();

    const otherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `admin-${otherSuffix}@e2e.com`,
        password: 'senhaSegura123',
      })
      .expect(200);
    const otherToken = otherLogin.body.accessToken as string;

    const otherCompaniesView = await request(app.getHttpServer())
      .get('/companies')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(otherCompaniesView.body).toHaveLength(1);
    expect(otherCompaniesView.body[0].id).toBe(otherCompanyId);

    await request(app.getHttpServer())
      .get(`/companies/${ownCompanyId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    const usersFromOtherCompany = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    const usersFromOtherCompanyIds = usersFromOtherCompany.body.map(
      (user: { id: string }) => user.id,
    );
    expect(usersFromOtherCompanyIds).not.toContain(adminId);

    if (adminId) {
      await request(app.getHttpServer())
        .get(`/users/${adminId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/users/${adminId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    }
  });
});
