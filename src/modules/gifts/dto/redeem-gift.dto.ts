import { IsInt, IsOptional, Min } from 'class-validator';

export class RedeemGiftDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}
