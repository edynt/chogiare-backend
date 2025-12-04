import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  IAddressRepository,
  ADDRESS_REPOSITORY,
} from '../../domain/repositories/address.repository.interface';
import { Address } from '../../domain/entities/address.entity';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Address | null> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    return address ? this.toDomain(address) : null;
  }

  async findByUserId(userId: number): Promise<Address[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return addresses.map((a) => this.toDomain(a));
  }

  async findDefaultByUserId(userId: number): Promise<Address | null> {
    const address = await this.prisma.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    return address ? this.toDomain(address) : null;
  }

  async create(
    data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Address> {
    const now = BigInt(Date.now());
    const address = await this.prisma.address.create({
      data: {
        userId: data.userId,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        street: data.street,
        city: data.city,
        state: data.state,
        district: data.district,
        ward: data.ward,
        zipCode: data.zipCode,
        country: data.country,
        isDefault: data.isDefault,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomain(address);
  }

  async update(id: number, data: Partial<Address>): Promise<Address> {
    const now = BigInt(Date.now());
    const address = await this.prisma.address.update({
      where: { id },
      data: {
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        street: data.street,
        city: data.city,
        state: data.state,
        district: data.district,
        ward: data.ward,
        zipCode: data.zipCode,
        country: data.country,
        isDefault: data.isDefault,
        updatedAt: now,
      },
    });

    return this.toDomain(address);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.address.delete({
      where: { id },
    });
  }

  async setAsDefault(id: number, userId: number): Promise<void> {
    // First, unset all default addresses for this user
    await this.prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
        updatedAt: BigInt(Date.now()),
      },
    });

    // Then set the specified address as default (if id is provided)
    if (id) {
      await this.prisma.address.update({
        where: { id },
        data: {
          isDefault: true,
          updatedAt: BigInt(Date.now()),
        },
      });
    }
  }

  private toDomain(address: any): Address {
    return {
      id: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      street: address.street,
      city: address.city,
      state: address.state,
      district: address.district,
      ward: address.ward,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}

