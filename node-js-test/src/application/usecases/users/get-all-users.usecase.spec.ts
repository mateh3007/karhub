import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { GetAllUsersUseCase } from './get-all-users.usecase';

describe('GetAllUsersUseCase', () => {
  it("fetches a page of the caller's company users", async () => {
    const user = new UserEntity({
      name: 'Jane Doe',
      email: 'jane@autopecas.com',
      password: 'hash',
      role: RoleEnum.USER,
      companyId: 'company-1',
    });
    const page = {
      data: [user],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    const userRepository = {
      findPageByCompanyId: jest.fn().mockResolvedValue(page),
    } as unknown as jest.Mocked<UserRepository>;
    const useCase = new GetAllUsersUseCase(userRepository);

    const result = await useCase.execute({
      companyId: 'company-1',
      page: 1,
      limit: 20,
    });

    expect(userRepository.findPageByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { page: 1, limit: 20 },
    );
    expect(result).toBe(page);
  });
});
