import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Gift } from './entities/gift.entity';
import { Redemption } from './entities/redemption.entity';
import { Rating } from './entities/rating.entity';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gift, Redemption, Rating]), UsersModule],
  controllers: [GiftsController],
  providers: [GiftsService],
})
export class GiftsModule {}
