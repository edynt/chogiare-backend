import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IAddressRepository,
  ADDRESS_REPOSITORY,
} from '@modules/address/domain/repositories/address.repository.interface';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
  ) {}

  async findAll(userId: number) {
    const addresses = await this.addressRepository.findByUserId(userId);
    return addresses.map((address) => this.formatAddressResponse(address));
  }

  async findOne(id: number, userId: number) {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException({
        message: 'Address not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (address.userId !== userId) {
      throw new ForbiddenException({
        message: 'Unauthorized to access this address',
        errorCode: ERROR_CODES.UNAUTHORIZED,
      });
    }

    return this.formatAddressResponse(address);
  }

  async findDefault(userId: number) {
    const address = await this.addressRepository.findDefaultByUserId(userId);
    return address ? this.formatAddressResponse(address) : null;
  }

  async create(userId: number, createAddressDto: CreateAddressDto) {
    const address = await this.addressRepository.create({
      userId,
      recipientName: createAddressDto.recipientName,
      recipientPhone: createAddressDto.recipientPhone,
      street: createAddressDto.street,
      city: createAddressDto.city,
      state: createAddressDto.state,
      district: createAddressDto.district,
      ward: createAddressDto.ward,
      zipCode: createAddressDto.zipCode,
      country: createAddressDto.country || 'Vietnam',
      isDefault: createAddressDto.isDefault || false,
    });

    return this.formatAddressResponse(address);
  }

  async update(id: number, userId: number, updateAddressDto: UpdateAddressDto) {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException({
        message: 'Address not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (address.userId !== userId) {
      throw new ForbiddenException({
        message: 'Unauthorized to update this address',
        errorCode: ERROR_CODES.UNAUTHORIZED,
      });
    }

    const updatedAddress = await this.addressRepository.update(id, updateAddressDto);
    return this.formatAddressResponse(updatedAddress);
  }

  async delete(id: number, userId: number) {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException({
        message: 'Address not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (address.userId !== userId) {
      throw new ForbiddenException({
        message: 'Unauthorized to delete this address',
        errorCode: ERROR_CODES.UNAUTHORIZED,
      });
    }

    await this.addressRepository.delete(id);
  }

  async setDefault(id: number, userId: number) {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException({
        message: 'Address not found',
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (address.userId !== userId) {
      throw new ForbiddenException({
        message: 'Unauthorized to update this address',
        errorCode: ERROR_CODES.UNAUTHORIZED,
      });
    }

    await this.addressRepository.setDefault(id, userId);
    const updatedAddress = await this.addressRepository.findById(id);
    return this.formatAddressResponse(updatedAddress!);
  }

  private formatAddressResponse(address: {
    id: number;
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
    createdAt: bigint;
    updatedAt: bigint;
  }) {
    return {
      id: address.id.toString(),
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
    };
  }
}


