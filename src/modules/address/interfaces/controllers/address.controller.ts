import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from '../../application/services/address.service';
import { CreateAddressDto } from '../../application/dto/create-address.dto';
import { UpdateAddressDto } from '../../application/dto/update-address.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressService.create(userId, createAddressDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.addressService.findAll(userId);
  }

  @Get('default')
  findDefault(@CurrentUser('id') userId: string) {
    return this.addressService.findDefault(userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.addressService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressService.update(id, userId, updateAddressDto);
  }

  @Patch(':id/set-default')
  setAsDefault(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.addressService.setAsDefault(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.addressService.remove(id, userId);
  }
}

