import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IAddressRepository } from '@modules/address/domain/repositories/address.repository.interface';
import { Address } from '@modules/address/domain/entities/address.entity';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Address | null> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return null;
    }

    return this.toDomainAddress(address);
  }

  async findByUserId(userId: number): Promise<Address[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((address) => this.toDomainAddress(address));
  }

  async findDefaultByUserId(userId: number): Promise<Address | null> {
    const address = await this.prisma.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!address) {
      return null;
    }

    return this.toDomainAddress(address);
  }

  async create(data: {
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
  }): Promise<Address> {
    const now = BigInt(Date.now());

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: {
          userId: data.userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

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
        addressMetadata: {},
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toDomainAddress(address);
  }

  async update(id: number, data: Partial<Address>): Promise<Address> {
    const updateData: Record<string, unknown> = {
      updatedAt: BigInt(Date.now()),
    };

    if (data.recipientName !== undefined) updateData.recipientName = data.recipientName;
    if (data.recipientPhone !== undefined) updateData.recipientPhone = data.recipientPhone;
    if (data.street !== undefined) updateData.street = data.street;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.district !== undefined) updateData.district = data.district;
    if (data.ward !== undefined) updateData.ward = data.ward;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.isDefault !== undefined) {
      updateData.isDefault = data.isDefault;
      if (data.isDefault) {
        const address = await this.prisma.address.findUnique({
          where: { id },
          select: { userId: true },
        });
        if (address) {
          await this.prisma.address.updateMany({
            where: {
              userId: address.userId,
              isDefault: true,
              id: { not: id },
            },
            data: {
              isDefault: false,
            },
          });
        }
      }
    }

    const address = await this.prisma.address.update({
      where: { id },
      data: updateData,
    });

    return this.toDomainAddress(address);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.address.delete({
      where: { id },
    });
  }

  async setDefault(id: number, userId: number): Promise<void> {
    await this.prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    await this.prisma.address.update({
      where: { id },
      data: {
        isDefault: true,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  private toDomainAddress(address: {
    id: number;
    userId: number;
    recipientName: string;
    recipientPhone: string;
    street: string;
    city: string;
    state: string;
    district: string | null;
    ward: string | null;
    zipCode: string;
    country: string;
    isDefault: boolean;
    addressMetadata: unknown;
    createdAt: bigint;
    updatedAt: bigint;
  }): Address {
    return {
      id: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      street: address.street,
      city: address.city,
      state: address.state,
      district: address.district || undefined,
      ward: address.ward || undefined,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      addressMetadata: address.addressMetadata as Record<string, unknown>,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
