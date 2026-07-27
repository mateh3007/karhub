export abstract class BaseUsecase<TInput = void, TOutput = void> {
  abstract execute(data: TInput): Promise<TOutput>;
}
