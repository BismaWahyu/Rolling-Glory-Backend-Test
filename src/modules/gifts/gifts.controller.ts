import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JsonApiType } from '../../common/decorators/json-api-type.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { GiftsService } from './gifts.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
import { RedeemGiftDto } from './dto/redeem-gift.dto';
import { BulkRedeemDto } from './dto/bulk-redeem.dto';
import { RateGiftDto } from './dto/rate-gift.dto';

@Controller('gifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@JsonApiType('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Public()
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.giftsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.giftsService.findOne(id);
  }

  @Public()
  @Get(':id/ratings')
  listRatings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const l = limit ? Math.min(100, Math.max(1, parseInt(limit, 10) || 10)) : 10;
    return this.giftsService.listRatings(id, p, l);
  }

  @Post('redeem')
  bulkRedeem(@Body() dto: BulkRedeemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.giftsService.bulkRedeem(user.id, dto);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateGiftDto) {
    return this.giftsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  replace(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateGiftDto) {
    return this.giftsService.replace(id, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGiftDto) {
    return this.giftsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const deleted = await this.giftsService.remove(id);
    return { id: deleted.id, message: `Gift "${deleted.name}" has been deleted successfully` };
  }

  @Post(':id/redeem')
  redeem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RedeemGiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.giftsService.redeem(id, user.id, dto);
  }

  @Post(':id/rating')
  rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateGiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.giftsService.rate(id, user.id, dto);
  }
}
