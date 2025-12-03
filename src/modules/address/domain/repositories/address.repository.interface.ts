import { Address } from '../entities/address.entity';

export const ADDRESS_REPOSITORY = 'ADDRESS_REPOSITORY';

export interface IAddressRepository {
  findById(id: string): Promise<Address | null>;
  findByUserId(userId: string): Promise<Address[]>;
  findDefaultByUserId(userId: string): Promise<Address | null>;
  create(data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<Address>;
  update(id: string, data: Partial<Address>): Promise<Address>;
  delete(id: string): Promise<void>;
  setAsDefault(id: string, userId: string): Promise<void>;
}

