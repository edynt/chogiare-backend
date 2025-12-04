import { Address } from '../entities/address.entity';

export const ADDRESS_REPOSITORY = 'ADDRESS_REPOSITORY';

export interface IAddressRepository {
  findById(id: number): Promise<Address | null>;
  findByUserId(userId: number): Promise<Address[]>;
  findDefaultByUserId(userId: number): Promise<Address | null>;
  create(data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<Address>;
  update(id: number, data: Partial<Address>): Promise<Address>;
  delete(id: number): Promise<void>;
  setAsDefault(id: number, userId: number): Promise<void>;
}

