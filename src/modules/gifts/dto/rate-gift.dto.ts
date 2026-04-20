import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class RateGiftDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review?: string;
}
