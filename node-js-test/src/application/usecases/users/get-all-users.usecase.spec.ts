import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { GetAllUsersUseCase } from './get-all-users.usecase';

describe('GetAllUsersUseCase', () => {
  it("fetches only the caller's company users", async () => {
    const users = [
      new UserEntity({
        name: 'Jane Doe',
        email: 'jane@autopecas.com',
        password: 'hash',
        role: RoleEnum.USER,
        companyId: 'company-1',
      }),
    ];
    const userRepository = {
      findByCompanyId: jest.fn().mockResolvedValue(users),
    } as unknown as jest.Mocked<UserRepository>;
    const useCase = new GetAllUsersUseCase(userRepository);

    const result = await useCase.execute({ companyId: 'company-1' });

    expect(userRepository.findByCompanyId).toHaveBeenCalledWith('company-1');
    expect(result).toBe(users);
  });
});
