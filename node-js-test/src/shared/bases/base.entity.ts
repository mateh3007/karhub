import { randomUUID } from 'crypto';

export interface IBaseEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class BaseEntity {
  private _id: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  constructor(data?: IBaseEntity) {
    this._id = data?.id ?? randomUUID();
    this._createdAt = data?.createdAt ?? new Date();
    this._updatedAt = data?.updatedAt ?? new Date();
    this._deletedAt = data?.deletedAt ?? null;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }
}
