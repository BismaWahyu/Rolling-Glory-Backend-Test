import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkRedeemItemDto {
  @IsUUID()
  giftId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}

export class BulkRedeemDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkRedeemItemDto)
  items: BulkRedeemItemDto[];
}
