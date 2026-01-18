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
    return await this.addressService.findAll(user.id);
  }

  @Get('default')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get default address' })
  async getDefault(@CurrentUser() user: CurrentUserPayload) {
    return await this.addressService.findDefault(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return await this.addressService.findOne(id, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new address' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return await this.addressService.create(user.id, createAddressDto);
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
    return await this.addressService.update(id, user.id, updateAddressDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete address' })
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    await this.addressService.delete(id, user.id);
    return { deleted: true };
  }

  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiParam({ name: 'id', type: String })
  async setDefault(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return await this.addressService.setDefault(id, user.id);
  }
}
