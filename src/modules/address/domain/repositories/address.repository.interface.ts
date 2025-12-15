import { Address } from '../entities/address.entity';

export const ADDRESS_REPOSITORY = 'ADDRESS_REPOSITORY';

export interface IAddressRepository {
  findById(id: number): Promise<Address | null>;
  findByUserId(userId: number): Promise<Address[]>;
  findDefaultByUserId(userId: number): Promise<Address | null>;
  create(data: {
    userId: number;
    recipientName: string;
    recipientPhone: string;
    street: string;
    city: string;
    state: string;
    district?: string;
    ward?: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }): Promise<Address>;
  update(id: number, data: Partial<Address>): Promise<Address>;
  delete(id: number): Promise<void>;
  setDefault(id: number, userId: number): Promise<void>;
}
