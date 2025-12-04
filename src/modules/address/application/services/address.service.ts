import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  IAddressRepository,
  ADDRESS_REPOSITORY,
} from '../../domain/repositories/address.repository.interface';
import { Address } from '../../domain/entities/address.entity';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';

@Injectable()
export class AddressService {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(
    userId: number,
    createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    // If setting as default, unset other default addresses
    if (createAddressDto.isDefault) {
      await this.addressRepository.setAsDefault('', userId);
    }

    const now = BigInt(Date.now());
    const address = await this.addressRepository.create({
      ...createAddressDto,
      userId,
      isDefault: createAddressDto.isDefault ?? false,
    });

    this.logger.log(`Address created: ${address.id}`, 'AddressService', {
      addressId: address.id,
      userId,
    });

    return address;
  }

  async findAll(userId: number): Promise<Address[]> {
    return this.addressRepository.findByUserId(userId);
  }

  async findOne(id: number, userId: number): Promise<Address> {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException(MESSAGES.ADDRESS.NOT_FOUND);
    }

    if (address.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to access address ${id} they don't own`,
        'AddressService',
      );
      throw new ForbiddenException(MESSAGES.ADDRESS.NOT_OWNER);
    }

    return address;
  }

  async findDefault(userId: number): Promise<Address | null> {
    return this.addressRepository.findDefaultByUserId(userId);
  }

  async update(
    id: number,
    userId: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException(MESSAGES.ADDRESS.NOT_FOUND);
    }

    if (address.userId !== userId) {
      throw new ForbiddenException(MESSAGES.ADDRESS.CANNOT_UPDATE);
    }

    // If setting as default, unset other default addresses
    if (updateAddressDto.isDefault) {
      await this.addressRepository.setAsDefault('', userId);
    }

    return this.addressRepository.update(id, updateAddressDto);
  }

  async setAsDefault(id: number, userId: number): Promise<Address> {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException(MESSAGES.ADDRESS.NOT_FOUND);
    }

    if (address.userId !== userId) {
      throw new ForbiddenException(MESSAGES.ADDRESS.CANNOT_UPDATE);
    }

    await this.addressRepository.setAsDefault(id, userId);

    this.logger.log(`Address set as default: ${id}`, 'AddressService', {
      addressId: id,
      userId,
    });

    return this.addressRepository.findById(id) as Promise<Address>;
  }

  async remove(id: number, userId: number): Promise<void> {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException(MESSAGES.ADDRESS.NOT_FOUND);
    }

    if (address.userId !== userId) {
      throw new ForbiddenException(MESSAGES.ADDRESS.CANNOT_DELETE);
    }

    await this.addressRepository.delete(id);

    this.logger.log(`Address deleted: ${id}`, 'AddressService', {
      addressId: id,
      userId,
    });
  }
}

