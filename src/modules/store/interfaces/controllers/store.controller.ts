import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { StoreService } from '../../application/services/store.service';
import { CreateStoreDto } from '../../application/dto/create-store.dto';
import { UpdateStoreDto } from '../../application/dto/update-store.dto';
import { QueryStoreDto } from '../../application/dto/query-store.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: number,
    @Body() createStoreDto: CreateStoreDto,
  ) {
    return this.storeService.create(userId, createStoreDto);
  }

  @Get()
  @Public()
  findAll(@Query() queryDto: QueryStoreDto) {
    return this.storeService.findAll(queryDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyStore(@CurrentUser('id') userId: number) {
    return this.storeService.findMyStore(userId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.findOne(id);
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.storeService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    // TODO: Check if user is admin
    return this.storeService.update(id, userId, updateStoreDto, false);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    // TODO: Check if user is admin
    return this.storeService.remove(id, userId, false);
  }
}

