import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export type SortOrder = 'ASC' | 'DESC';
export type GiftSortBy = 'newest' | 'rating';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['newest', 'rating'])
  sortBy?: GiftSortBy = 'newest';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: SortOrder = 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  inStock?: boolean;
}
