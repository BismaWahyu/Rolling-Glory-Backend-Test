import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

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
}
