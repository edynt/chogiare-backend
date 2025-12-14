import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AddressService } from '@modules/address/application/services/address.service';
import { CreateAddressDto } from '@modules/address/application/dto/create-address.dto';
import { UpdateAddressDto } from '@modules/address/application/dto/update-address.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all addresses for current user' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    const addresses = await this.addressService.findAll(user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: addresses,
    };
  }

  @Get('default')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get default address' })
  async getDefault(@CurrentUser() user: CurrentUserPayload) {
    const address = await this.addressService.findDefault(user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: address,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    const address = await this.addressService.findOne(id, user.id);
    return {
      message: MESSAGES.SUCCESS,
      data: address,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new address' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() createAddressDto: CreateAddressDto) {
    const address = await this.addressService.create(user.id, createAddressDto);
    return {
      message: MESSAGES.CREATED,
      data: address,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update address' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.addressService.update(id, user.id, updateAddressDto);
    return {
      message: MESSAGES.UPDATED,
      data: address,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete address' })
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    await this.addressService.delete(id, user.id);
    return {
      message: MESSAGES.DELETED,
    };
  }

  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiParam({ name: 'id', type: String })
  async setDefault(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    const address = await this.addressService.setDefault(id, user.id);
    return {
      message: MESSAGES.UPDATED,
      data: address,
    };
  }
}


