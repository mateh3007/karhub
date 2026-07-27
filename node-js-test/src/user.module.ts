import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/usecases/users/create-user.usecase';
import { DeleteUserUseCase } from './application/usecases/users/delete-user.usecase';
import { GetAllUsersUseCase } from './application/usecases/users/get-all-users.usecase';
import { GetUserByIdUseCase } from './application/usecases/users/get-user-by-id.usecase';
import { UpdateUserUseCase } from './application/usecases/users/update-user.usecase';
import { DatabaseModule } from './infra/database/database.module';
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    GetAllUsersUseCase,
    GetUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
